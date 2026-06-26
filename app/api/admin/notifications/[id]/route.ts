import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const clinicId = await requireClinicId(request);

  try {
    const existing = await prisma.notification.findFirst({
      where: { id: params.id, clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
