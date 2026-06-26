import { NextRequest, NextResponse } from "next/server";
import {
  authErrorResponse,
  getClientIp,
  requirePermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import {
  buildClinicBackup,
  restoreClinicBackup,
  backupSummary,
} from "@/lib/clinic-backup";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "clinic:manage");
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Только владелец может создавать копии" }, { status: 403 });
    }

    const backup = await buildClinicBackup(user.clinicId);
    return NextResponse.json(backup);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(
    "backup-restore",
    ip,
    RATE_LIMITS.admin.limit,
    RATE_LIMITS.admin.windowMs,
  );
  if (!rl.allowed) {
    return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
  }

  try {
    const user = await requirePermission(request, "clinic:manage");
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Только владелец может восстанавливать данные" }, { status: 403 });
    }

    let body: { backup?: unknown; confirm?: boolean };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
    }

    if (!body.confirm) {
      return NextResponse.json({ error: "Требуется подтверждение восстановления" }, { status: 400 });
    }

    const counts = await restoreClinicBackup(user.clinicId, body.backup);

    await writeAudit({
      userId: user.userId,
      clinicId: user.clinicId,
      action: "backup.restore",
      entity: "clinic",
      entityId: user.clinicId,
      ip,
      metadata: counts,
    });

    return NextResponse.json({
      success: true,
      counts,
      summary: backupSummary(
        body.backup as Awaited<ReturnType<typeof buildClinicBackup>>,
      ),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return authErrorResponse(error);
    }
    const message = error instanceof Error ? error.message : "Не удалось восстановить данные";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
