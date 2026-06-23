export interface PatientProfile {
  firstName: string;
  lastName: string;
  phone: string;
  updatedAt: string;
}

const STORAGE_KEY = "inclinic-patient-profile";

export function loadPatientProfile(): PatientProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PatientProfile;
    if (!parsed.firstName && !parsed.lastName && !parsed.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePatientProfile(data: {
  firstName: string;
  lastName: string;
  phone: string;
}): void {
  const profile: PatientProfile = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone: data.phone.trim(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
