import { NextRequest } from "next/server";
import { getDefaultClinicId } from "@/lib/booking-rules";

export function getClinicIdFromRequest(request: NextRequest): string | null {
  return request.headers.get("x-clinic-id");
}

export async function requireClinicId(request: NextRequest): Promise<string> {
  const fromAuth = getClinicIdFromRequest(request);
  if (fromAuth) return fromAuth;
  return getDefaultClinicId();
}
