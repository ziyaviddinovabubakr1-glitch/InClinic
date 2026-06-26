import { NextRequest, NextResponse } from "next/server";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { loadDoctorAnalytics } from "@/lib/admin/db/doctor-analytics";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const ip = getClientIp(request);
  const userId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", userId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const clinicId = await requireClinicId(request);
    const analytics = await loadDoctorAnalytics(clinicId, params.id);

    if (!analytics) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    return NextResponse.json({ analytics });
  } catch (err) {
    console.error("[admin/doctors/[id]/analytics GET]", err);
    return NextResponse.json({ error: "Ошибка загрузки аналитики" }, { status: 500 });
  }
}
