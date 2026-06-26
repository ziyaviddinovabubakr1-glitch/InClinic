import { NextRequest, NextResponse } from "next/server";
import type { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { mapDbReviewToUi, uiStatusToDb } from "@/lib/admin/review-mappers";
import { validateReviewPatch } from "@/lib/admin/validators/review";
import { validateReviewInput } from "@/lib/reviews";
import { createClinicNotification } from "@/lib/notifications-db";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const errors = validateReviewPatch(body);
  if (errors.length) {
    return NextResponse.json({ error: errors[0] }, { status: 422 });
  }

  try {
    const existing = await prisma.review.findFirst({
      where: { id: params.id, clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 });
    }

    const data: { status?: ReviewStatus; rating?: number; comment?: string | null } = {};

    if (body.status !== undefined) {
      const status = uiStatusToDb(String(body.status));
      if (!status) {
        return NextResponse.json({ error: "Некорректный status" }, { status: 422 });
      }
      data.status = status;
    }
    if (body.rating !== undefined) {
      data.rating = validateReviewInput({ rating: body.rating }).rating;
    }
    if (body.comment !== undefined) {
      data.comment =
        body.comment === null || body.comment === ""
          ? null
          : String(body.comment).trim().slice(0, 2000);
    }

    const review = await prisma.review.update({
      where: { id: params.id },
      data,
      include: REVIEW_INCLUDE,
    });

    let action = "review.update";
    if (data.status === "APPROVED" && existing.status !== "APPROVED") {
      action = "review.approve";
    } else if (data.status === "REJECTED" && existing.status !== "REJECTED") {
      action = "review.reject";
    }

    await writeAudit({
      userId,
      clinicId,
      action,
      entity: "review",
      entityId: review.id,
      ip,
      oldData: { status: existing.status, rating: existing.rating },
      newData: { status: review.status, rating: review.rating },
    });

    if (action === "review.approve") {
      try {
        await createClinicNotification({
          clinicId,
          type: "review",
          title: "Отзыв одобрен",
          message: `${review.patient.firstName} ${review.patient.lastName} · ${review.rating}★`,
        });
      } catch (notifyErr) {
        console.error("[admin/reviews PATCH] notification failed:", notifyErr);
      }
    }

    return NextResponse.json({ review: mapDbReviewToUi(review) });
  } catch (err) {
    console.error("[admin/reviews/[id] PATCH]", err);
    return NextResponse.json({ error: "Ошибка обновления отзыва" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const limited = await adminRateLimit(request);
  if (limited) return limited;

  const clinicId = await requireClinicId(request);
  const userId = request.headers.get("x-user-id");
  const ip = getClientIp(request);

  try {
    const existing = await prisma.review.findFirst({
      where: { id: params.id, clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 });
    }

    await prisma.review.delete({ where: { id: params.id } });

    await writeAudit({
      userId,
      clinicId,
      action: "review.delete",
      entity: "review",
      entityId: params.id,
      ip,
      oldData: {
        bookingId: existing.bookingId,
        rating: existing.rating,
        status: existing.status,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/reviews/[id] DELETE]", err);
    return NextResponse.json({ error: "Ошибка удаления отзыва" }, { status: 500 });
  }
}
