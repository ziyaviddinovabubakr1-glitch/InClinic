import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowMockFallback } from "@/lib/env";
import { getDefaultClinicId } from "@/lib/booking-rules";
import { MOCK_DOCTORS } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  try {
    const clinicId = await getDefaultClinicId();
    const serviceId = request.nextUrl.searchParams.get("serviceId");

    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: serviceId, clinicId, active: true },
      });
      if (!service) {
        return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
      }
    }

    const doctors = await prisma.doctor.findMany({
      where: {
        clinicId,
        active: true,
        ...(serviceId ? { services: { some: { serviceId } } } : {}),
      },
      orderBy: { nameRu: "asc" },
      select: {
        id: true,
        nameRu: true,
        nameTj: true,
        specialtyRu: true,
        specialtyTj: true,
        photoUrl: true,
        workDays: true,
        workStart: true,
        workEnd: true,
      },
    });

    return NextResponse.json({ doctors });
  } catch {
    if (!allowMockFallback()) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    return NextResponse.json({ doctors: MOCK_DOCTORS });
  }
}
