const KEY = "inclinic-doctor-session";

export interface DoctorSession {
  doctorId: string;
  fullName: string;
  specialty: string;
}

export function getDoctorSession(): DoctorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DoctorSession) : null;
  } catch {
    return null;
  }
}

export function setDoctorSession(session: DoctorSession): void {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearDoctorSession(): void {
  sessionStorage.removeItem(KEY);
}
