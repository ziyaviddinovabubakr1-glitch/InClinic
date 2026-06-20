import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { allowMockFallback } from "@/lib/env";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit("booking-status", ip, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id || id.length < 8) {
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { status: true, rejectionReason: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
    }

    return NextResponse.json({
      status: booking.status,
      rejectionReason: booking.rejectionReason,
    });
  } catch {
    if (allowMockFallback()) {
      return NextResponse.json({ status: "PENDING", rejectionReason: null });
    }
    return NextResponse.json({ error: "Сервис недоступен" }, { status: 503 });
  }
}
