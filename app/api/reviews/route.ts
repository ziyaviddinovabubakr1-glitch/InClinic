import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultClinicId } from "@/lib/booking-rules";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import {
  createReviewForBooking,
  ReviewValidationError,
  validateReviewInput,
} from "@/lib/reviews";
import { mapDbReviewToUi } from "@/lib/admin/review-mappers";
import { createClinicNotification } from "@/lib/notifications-db";

export const dynamic = "force-dynamic";

const REVIEW_INCLUDE = {
  patient: { select: { firstName: true, lastName: true } },
  doctor: { select: { nameRu: true } },
  booking: {
    select: {
      serviceId: true,
      service: { select: { nameRu: true } },
    },
  },
} as const;

/** Public endpoint — patient submits review after completed visit. */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit("reviews", ip, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  if (typeof body.bookingId !== "string" || !body.bookingId.trim()) {
    return NextResponse.json({ error: "bookingId обязателен" }, { status: 422 });
  }

  try {
    const clinicId = await getDefaultClinicId();
    const { rating, comment } = validateReviewInput({
      rating: body.rating,
      comment: body.comment,
    });

    const { id } = await createReviewForBooking({
      clinicId,
      bookingId: body.bookingId.trim(),
      rating,
      comment,
      status: "PENDING",
    });

    const review = await prisma.review.findUniqueOrThrow({
      where: { id },
      include: REVIEW_INCLUDE,
    });

    try {
      await createClinicNotification({
        clinicId,
        type: "review",
        title: "Новый отзыв",
        message: `${review.patient.firstName} ${review.patient.lastName} · ${review.rating}★ · ${review.doctor.nameRu}`,
      });
    } catch (notifyErr) {
      console.error("[reviews POST] notification failed:", notifyErr);
    }

    return NextResponse.json(
      { success: true, review: mapDbReviewToUi(review) },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ReviewValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[reviews POST]", err);
    return NextResponse.json({ error: "Ошибка создания отзыва" }, { status: 500 });
  }
}
