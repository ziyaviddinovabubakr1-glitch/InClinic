import type {
  Paginated,
  Patient,
  PatientGender,
  PatientProfile,
  PatientSegment,
} from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";

export interface PatientQuery {
  search?: string;
  segment?: PatientSegment | "ALL";
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "name" | "totalPaid";
  createdFrom?: string;
  createdTo?: string;
}

export interface PatientInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthDate?: string | null;
  gender?: PatientGender | null;
  address?: string | null;
  notes?: string | null;
}

type PatientsResponse = {
  rows: Patient[];
  total: number;
  page: number;
  pageSize: number;
};

export function listPatients(query: PatientQuery = {}): Promise<Paginated<Patient>> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.segment && query.segment !== "ALL") params.set("segment", query.segment);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.sort) params.set("sort", query.sort);
  if (query.createdFrom) params.set("createdFrom", query.createdFrom);
  if (query.createdTo) params.set("createdTo", query.createdTo);
  return adminFetch<PatientsResponse>(`/api/admin/patients?${params}`);
}

export function getPatientProfile(id: string): Promise<PatientProfile> {
  return adminFetch<{ profile: PatientProfile }>(`/api/admin/patients/${id}`).then(
    (d) => d.profile,
  );
}

export function createPatient(input: PatientInput): Promise<Patient> {
  return adminFetch<{ patient: Patient }>("/api/admin/patients", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((d) => d.patient);
}

export function updatePatient(id: string, input: Partial<PatientInput>): Promise<Patient> {
  return adminFetch<{ patient: Patient }>(`/api/admin/patients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).then((d) => d.patient);
}

export function deletePatient(id: string): Promise<{ ok: boolean; softDeleted?: boolean }> {
  return adminFetch<{ success: boolean; softDeleted?: boolean }>(`/api/admin/patients/${id}`, {
    method: "DELETE",
  }).then((d) => ({ ok: true, softDeleted: d.softDeleted })).catch(() => ({ ok: false }));
}

export type { PatientGender };

export function getSegmentCounts(): Promise<Record<PatientSegment, number>> {
  return adminFetch<{ counts: Record<PatientSegment, number> }>(
    "/api/admin/patients?counts=1",
  ).then((d) => d.counts);
}
