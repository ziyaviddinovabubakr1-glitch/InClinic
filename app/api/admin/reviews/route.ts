import { NextRequest, NextResponse } from "next/server";
import type { Prisma, ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import {
  buildReviewAnalytics,
  mapDbReviewToUi,
  uiStatusToDb,
} from "@/lib/admin/review-mappers";
import { validateReviewCreate } from "@/lib/admin/validators/review";
import {
  createReviewForBooking,
  ReviewValidationError,
  loadDoctorReviewStats,
  validateReviewInput,
} from "@/lib/reviews";

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

async function adminRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const userId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", userId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  return null;
}

function buildWhere(
  clinicId: string,
  search: string,
  status: ReviewStatus | "ALL",
  doctorId: string | null,
  rating: number | null,
): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = { clinicId };

  if (status !== "ALL") where.status = status;
  if (doctorId) where.doctorId = doctorId;
  if (rating !== null) where.rating = rating;

  if (search) {
    where.OR = [
      { comment: { contains: search, mode: "insensitive" } },
      { patient: { firstName: { contains: search, mode: "insensitive" } } },
      { patient: { lastName: { contains: search, mode: "insensitive" } } },
      { doctor: { nameRu: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export async function GET(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const limited = await adminRateLimit(request);
  if (limited) return limited;

  const clinicId = await requireClinicId(request);
  const { searchParams } = request.nextUrl;
  const search = (searchParams.get("search") ?? "").trim();
  const statusParam = searchParams.get("status") ?? "ALL";
  const doctorId = searchParams.get("doctorId");
  const ratingParam = searchParams.get("rating");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );
  const analyticsOnly = searchParams.get("analytics") === "1";

  const status =
    statusParam === "ALL" ? "ALL" : (uiStatusToDb(statusParam) ?? "ALL");
  const rating =
    ratingParam && ratingParam !== "ALL"
      ? parseInt(ratingParam, 10)
      : null;

  try {
    if (analyticsOnly) {
      const [reviews, doctors, doctorStats] = await Promise.all([
        prisma.review.findMany({
          where: { clinicId },
          include: REVIEW_INCLUDE,
          orderBy: { createdAt: "desc" },
          take: 5000,
        }),
        prisma.doctor.findMany({
          where: { clinicId },
          select: { id: true, nameRu: true },
        }),
        loadDoctorReviewStats(clinicId),
      ]);

      return NextResponse.json({
        analytics: buildReviewAnalytics(reviews, doctorStats, doctors),
      });
    }

    const where = buildWhere(
      clinicId,
      search,
      status as ReviewStatus | "ALL",
      doctorId,
      rating !== null && rating >= 1 && rating <= 5 ? rating : null,
    );

    const [rows, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: REVIEW_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      rows: rows.map(mapDbReviewToUi),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("[admin/reviews GET]", err);
    return NextResponse.json({ error: "Ошибка загрузки отзывов" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const limited = await adminRateLimit(request);
  if (limited) return limited;

  const clinicId = await requireClinicId(request);
  const userId = request.headers.get("x-user-id");
  const ip = getClientIp(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const errors = validateReviewCreate(body);
  if (errors.length) {
    return NextResponse.json({ error: errors[0] }, { status: 422 });
  }

  try {
    const { rating, comment } = validateReviewInput({
      rating: body.rating,
      comment: body.comment,
    });
    const statusParam = body.status ? uiStatusToDb(String(body.status)) : null;

    const { id } = await createReviewForBooking({
      clinicId,
      bookingId: (body.bookingId as string).trim(),
      rating,
      comment,
      status: statusParam ?? "PENDING",
    });

    const review = await prisma.review.findUniqueOrThrow({
      where: { id },
      include: REVIEW_INCLUDE,
    });

    await writeAudit({
      userId,
      clinicId,
      action: "review.create",
      entity: "review",
      entityId: id,
      ip,
      newData: { bookingId: review.bookingId, rating, status: review.status },
    });

    return NextResponse.json(
      { review: mapDbReviewToUi(review) },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ReviewValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/reviews POST]", err);
    return NextResponse.json({ error: "Ошибка создания отзыва" }, { status: 500 });
  }
}
