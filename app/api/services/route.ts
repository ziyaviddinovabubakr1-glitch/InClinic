import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowMockFallback } from "@/lib/env";
import { getDefaultClinicId } from "@/lib/booking-rules";
import { MOCK_SERVICES } from "@/lib/mockData";

export async function GET() {
  try {
    const clinicId = await getDefaultClinicId();
    const services = await prisma.service.findMany({
      where: { clinicId, active: true },
      orderBy: { nameRu: "asc" },
      select: {
        id: true,
        nameRu: true,
        nameTj: true,
        descriptionRu: true,
        descriptionTj: true,
        durationMin: true,
        price: true,
        iconName: true,
        _count: { select: { doctors: true } },
      },
    });
    return NextResponse.json({ services });
  } catch {
    if (!allowMockFallback()) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    return NextResponse.json({ services: MOCK_SERVICES });
  }
}
