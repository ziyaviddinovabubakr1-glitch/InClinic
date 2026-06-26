import type { BookingStatus } from "@prisma/client";
import type {
  Appointment,
  AppointmentStatus,
  Doctor,
  DoctorStatus,
  Service,
} from "@/lib/admin/types";

/** UI appointment status ↔ Prisma BookingStatus */
export function uiStatusToDb(status: AppointmentStatus): BookingStatus {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "CONFIRMED":
      return "ACCEPTED";
    case "CANCELLED":
      return "REJECTED";
    case "COMPLETED":
      return "COMPLETED";
  }
}

export function dbStatusToUi(status: BookingStatus): AppointmentStatus {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "ACCEPTED":
      return "CONFIRMED";
    case "REJECTED":
      return "CANCELLED";
    case "COMPLETED":
      return "COMPLETED";
  }
}

export function uiFilterStatusToDb(
  status: AppointmentStatus | "ALL",
): BookingStatus | "ALL" {
  if (status === "ALL") return "ALL";
  return uiStatusToDb(status);
}

/** Admin UI uses 1=Mon … 7=Sun; Prisma/JS uses 0=Sun … 6=Sat. */
export function uiWorkDaysToDb(days: number[]): number[] {
  return days.map((d) => (d === 7 ? 0 : d));
}

export function dbWorkDaysToUi(days: number[]): number[] {
  return days.map((d) => (d === 0 ? 7 : d));
}

export type DbBookingRow = {
  id: string;
  patientId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  phoneHash: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  serviceId: string;
  doctorId: string;
  service: { nameRu: string; price: number | null };
  doctor: { nameRu: string };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
};

export function mapBookingToAppointment(b: DbBookingRow): Appointment {
  const completedAt =
    b.status === "COMPLETED"
      ? new Date(b.updatedAt).toISOString()
      : null;

  const linked = b.patient;
  const patientId = b.patientId ?? linked?.id ?? "";
  const patientName = linked
    ? `${linked.firstName} ${linked.lastName}`.trim()
    : `${b.firstName} ${b.lastName}`.trim();
  const patientPhone = linked?.phone ?? b.phone;

  return {
    id: b.id,
    patientId,
    patientName,
    patientPhone,
    doctorId: b.doctorId,
    doctorName: b.doctor.nameRu,
    serviceId: b.serviceId,
    serviceName: b.service.nameRu,
    date: b.date,
    time: b.timeSlot,
    status: dbStatusToUi(b.status),
    price: b.service.price ?? 0,
    createdAt: new Date(b.createdAt).toISOString(),
    completedAt,
  };
}

export type DbDoctorRow = {
  id: string;
  nameRu: string;
  nameTj: string;
  specialtyRu: string;
  specialtyTj: string;
  photoUrl: string | null;
  workDays: number[];
  workStart: string;
  workEnd: string;
  active: boolean;
  createdAt: Date | string;
  _count?: { bookings: number };
  services?: { service: { id: string; nameRu: string } }[];
};

export function mapDbDoctorToUi(
  d: DbDoctorRow,
  stats?: { patientsCount?: number; revenue?: number; averageRating?: number; reviewCount?: number },
): Doctor {
  const appointmentsCount = d._count?.bookings ?? 0;
  return {
    id: d.id,
    photoUrl: d.photoUrl,
    fullName: d.nameRu,
    phone: "",
    specialty: d.specialtyRu,
    experienceYears: 0,
    education: "",
    languages: ["Русский", "Тоҷикӣ"],
    consultationPrice: 0,
    workSchedule: {
      days: dbWorkDaysToUi(d.workDays),
      start: d.workStart,
      end: d.workEnd,
    },
    status: d.active ? "ACTIVE" : ("HIDDEN" as DoctorStatus),
    rating: stats?.averageRating ?? 0,
    reviewCount: stats?.reviewCount ?? 0,
    patientsCount: stats?.patientsCount ?? 0,
    appointmentsCount,
    revenueGenerated: stats?.revenue ?? 0,
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

export function mapDoctorInputToDb(input: {
  fullName: string;
  specialty: string;
  photoUrl: string | null;
  workSchedule: { days: number[]; start: string; end: string };
  status: DoctorStatus;
}) {
  return {
    nameRu: input.fullName.trim(),
    nameTj: input.fullName.trim(),
    specialtyRu: input.specialty.trim(),
    specialtyTj: input.specialty.trim(),
    photoUrl: input.photoUrl,
    workDays: uiWorkDaysToDb(input.workSchedule.days),
    workStart: input.workSchedule.start,
    workEnd: input.workSchedule.end,
    active: input.status === "ACTIVE",
  };
}

export type DbServiceRow = {
  id: string;
  nameRu: string;
  descriptionRu: string;
  durationMin: number;
  price: number | null;
  active: boolean;
  _count?: { bookings: number };
};

export function mapDbServiceToUi(
  s: DbServiceRow,
  maxSales?: number,
): Service {
  const salesCount = s._count?.bookings ?? 0;
  const revenue = salesCount * (s.price ?? 0);
  const popularity =
    maxSales && maxSales > 0 ? Math.round((salesCount / maxSales) * 100) : 0;
  return {
    id: s.id,
    name: s.nameRu,
    description: s.descriptionRu,
    price: s.price ?? 0,
    durationMin: s.durationMin,
    active: s.active,
    salesCount,
    revenue,
    popularity,
  };
}

export function mapServiceInputToDb(input: {
  name: string;
  description: string;
  price: number;
  durationMin: number;
  active: boolean;
}) {
  return {
    nameRu: input.name.trim(),
    nameTj: input.name.trim(),
    descriptionRu: input.description.trim(),
    descriptionTj: input.description.trim(),
    durationMin: input.durationMin,
    price: input.price,
    active: input.active,
  };
}
