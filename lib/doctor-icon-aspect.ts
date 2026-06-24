import { inferDoctorGender, type DoctorGender } from "@/lib/doctor-gender";

/** Height / width of portrait PNG exports (must match processed assets). */
export const DOCTOR_ICON_ASPECT: Record<DoctorGender, number> = {
  female: 935 / 741,
  male: 1010 / 678,
};

export function getDoctorIconAspect(fullName?: string | null): number {
  return DOCTOR_ICON_ASPECT[inferDoctorGender(fullName)];
}
