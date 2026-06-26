import type { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class ReviewValidationError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ReviewValidationError";
  }
}

export function validateReviewInput(input: {
  rating: unknown;
  comment?: unknown;
}): { rating: number; comment: string | null } {
  const rating = typeof input.rating === "number" ? input.rating : Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewValidationError("Рейтинг должен быть от 1 до 5", 422);
  }
  const comment =
    input.comment === undefined || input.comment === null || input.comment === ""
      ? null
      : String(input.comment).trim().slice(0, 2000);
  return { rating, comment };
}

export async function createReviewForBooking(input: {
  clinicId: string;
  bookingId: string;
  rating: number;
  comment?: string | null;
  status?: ReviewStatus;
}): Promise<{ id: string }> {
  const booking = await prisma.booking.findFirst({
    where: { id: input.bookingId, clinicId: input.clinicId },
    include: { review: { select: { id: true } } },
  });

  if (!booking) {
    throw new ReviewValidationError("Запись не найдена", 404);
  }

  if (booking.status !== "COMPLETED") {
    throw new ReviewValidationError(
      "Отзыв можно оставить только после завершённого визита",
      403,
    );
  }

  if (!booking.patientId) {
    throw new ReviewValidationError("Запись не связана с пациентом", 422);
  }

  if (booking.review) {
    throw new ReviewValidationError("Отзыв по этой записи уже существует", 409);
  }

  const review = await prisma.review.create({
    data: {
      clinicId: input.clinicId,
      patientId: booking.patientId,
      doctorId: booking.doctorId,
      bookingId: booking.id,
      rating: input.rating,
      comment: input.comment ?? null,
      status: input.status ?? "PENDING",
    },
  });

  return { id: review.id };
}

export async function loadDoctorReviewStats(clinicId: string) {
  const rows = await prisma.review.groupBy({
    by: ["doctorId"],
    where: { clinicId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { id: true },
  });

  const map = new Map<string, { averageRating: number; reviewCount: number }>();
  for (const r of rows) {
    map.set(r.doctorId, {
      averageRating: Math.round((r._avg.rating ?? 0) * 10) / 10,
      reviewCount: r._count.id,
    });
  }
  return map;
}

export async function loadClinicReviewStats(clinicId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [approvedAgg, pendingCount, monthCount, topDoctor] = await Promise.all([
    prisma.review.aggregate({
      where: { clinicId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.review.count({ where: { clinicId, status: "PENDING" } }),
    prisma.review.count({
      where: { clinicId, createdAt: { gte: monthStart } },
    }),
    prisma.review.groupBy({
      by: ["doctorId"],
      where: { clinicId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { id: true },
      orderBy: { _avg: { rating: "desc" } },
      take: 1,
    }),
  ]);

  let topRatedDoctor: { id: string; name: string; rating: number; reviews: number } | null =
    null;

  if (topDoctor[0]) {
    const doc = await prisma.doctor.findUnique({
      where: { id: topDoctor[0].doctorId },
      select: { id: true, nameRu: true },
    });
    if (doc) {
      topRatedDoctor = {
        id: doc.id,
        name: doc.nameRu,
        rating: Math.round((topDoctor[0]._avg.rating ?? 0) * 10) / 10,
        reviews: topDoctor[0]._count.id,
      };
    }
  }

  return {
    averageRating: Math.round((approvedAgg._avg.rating ?? 0) * 10) / 10,
    totalApproved: approvedAgg._count.id,
    pendingCount,
    reviewsThisMonth: monthCount,
    topRatedDoctor,
  };
}
