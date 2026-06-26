import type { Doctor, DoctorAnalytics } from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";
import {
  mapDbDoctorToUi,
  mapDoctorInputToDb,
  type DbDoctorRow,
} from "@/lib/admin/mappers";
import { setDoctorCredentials, removeDoctorCredentials } from "@/lib/doctor-credentials";

export interface DoctorQuery {
  search?: string;
  status?: Doctor["status"] | "ALL";
}

type DoctorsResponse = {
  doctors: Array<
    DbDoctorRow & { averageRating?: number; reviewCount?: number }
  >;
};

export function listDoctors(query: DoctorQuery = {}): Promise<Doctor[]> {
  return adminFetch<DoctorsResponse>("/api/admin/doctors").then(({ doctors }) => {
    let rows = doctors.map((d) =>
      mapDbDoctorToUi(d, {
        averageRating: d.averageRating,
        reviewCount: d.reviewCount,
      }),
    );
    if (query.status && query.status !== "ALL") {
      rows = rows.filter((d) => d.status === query.status);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      rows = rows.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")),
      );
    }
    rows.sort((a, b) => b.appointmentsCount - a.appointmentsCount);
    return rows;
  });
}

export function getDoctor(id: string): Promise<Doctor | null> {
  return listDoctors().then((rows) => rows.find((d) => d.id === id) ?? null);
}

export type DoctorInput = Omit<
  Doctor,
  "id" | "rating" | "reviewCount" | "patientsCount" | "appointmentsCount" | "revenueGenerated" | "createdAt"
>;

export async function createDoctor(
  input: DoctorInput,
  opts?: { password?: string },
): Promise<Doctor> {
  const body = mapDoctorInputToDb(input);
  const data = await adminFetch<{ doctor: DbDoctorRow }>("/api/admin/doctors", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (opts?.password?.trim() && input.phone) {
    setDoctorCredentials(input.phone, opts.password.trim());
  }
  return mapDbDoctorToUi(data.doctor);
}

export async function updateDoctor(
  id: string,
  patch: Partial<DoctorInput>,
): Promise<Doctor | null> {
  const current = await getDoctor(id);
  if (!current) return null;

  const merged: DoctorInput = {
    photoUrl: patch.photoUrl ?? current.photoUrl,
    fullName: patch.fullName ?? current.fullName,
    phone: patch.phone ?? current.phone,
    specialty: patch.specialty ?? current.specialty,
    experienceYears: patch.experienceYears ?? current.experienceYears,
    education: patch.education ?? current.education,
    languages: patch.languages ?? current.languages,
    consultationPrice: patch.consultationPrice ?? current.consultationPrice,
    workSchedule: patch.workSchedule ?? current.workSchedule,
    status: patch.status ?? current.status,
  };

  const data = await adminFetch<{ doctor: DbDoctorRow }>(`/api/admin/doctors/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapDoctorInputToDb(merged)),
  });
  return mapDbDoctorToUi(data.doctor);
}

export async function deleteDoctor(id: string): Promise<{ ok: boolean }> {
  const current = await getDoctor(id);
  try {
    await adminFetch<{ success: boolean }>(`/api/admin/doctors/${id}`, {
      method: "DELETE",
    });
    if (current?.phone) removeDoctorCredentials(current.phone);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function setDoctorStatus(
  id: string,
  status: Doctor["status"],
): Promise<Doctor | null> {
  return updateDoctor(id, { status });
}

export async function getDoctorAnalytics(id: string): Promise<DoctorAnalytics | null> {
  try {
    const data = await adminFetch<{ analytics: DoctorAnalytics }>(
      `/api/admin/doctors/${id}/analytics`,
    );
    return data.analytics;
  } catch {
    return null;
  }
}
