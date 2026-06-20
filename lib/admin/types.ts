/**
 * Owner Admin Panel — domain types.
 *
 * These types describe the shape of every entity surfaced in the admin panel.
 * They are intentionally backend-agnostic: today they are produced by the mock
 * generators in `lib/admin/mock`, but the same shapes are what the future real
 * API / Prisma layer must return. UI components depend ONLY on these types and
 * on the service functions in `lib/admin/services` — never on mock data.
 */

/* ─────────────────────────  Roles (future-ready)  ───────────────────────── */
export type Role = "OWNER" | "ADMIN" | "DOCTOR" | "PATIENT";

/** Only OWNER is active in V1. The rest are reserved for future releases. */
export const ACTIVE_ROLES: Role[] = ["OWNER"];

/* ─────────────────────────────  Enums  ──────────────────────────────────── */
export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type DoctorStatus = "ACTIVE" | "HIDDEN";

export type PatientSegment = "NEW" | "REGULAR" | "VIP" | "INACTIVE";

export type ReviewVisibility = "PUBLISHED" | "PENDING" | "HIDDEN";

export type NotificationType =
  | "patient"
  | "appointment"
  | "review"
  | "cancel"
  | "doctor"
  | "schedule";

/* ─────────────────────────────  Doctor  ─────────────────────────────────── */
export interface WorkSchedule {
  /** ISO weekday numbers the doctor works: 1 = Mon … 7 = Sun. */
  days: number[];
  start: string; // "09:00"
  end: string; // "17:00"
}

export interface Doctor {
  id: string;
  photoUrl: string | null;
  fullName: string;
  specialty: string;
  experienceYears: number;
  education: string;
  languages: string[];
  consultationPrice: number;
  workSchedule: WorkSchedule;
  status: DoctorStatus;
  /** Derived analytics (computed from historical data in a real backend). */
  rating: number; // 0–5
  patientsCount: number;
  appointmentsCount: number;
  revenueGenerated: number;
  createdAt: string; // ISO
}

export interface DoctorAnalytics {
  doctorId: string;
  revenue: number;
  appointments: number;
  patients: number;
  rating: number;
  repeatPatients: number;
  /** Utilisation 0–100 (% of available slots booked). */
  load: number;
  /** Monthly performance series for charts. */
  performance: TimeSeriesPoint[];
}

/* ─────────────────────────────  Patient  ────────────────────────────────── */
export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  registeredAt: string; // ISO
  lastVisitAt: string | null; // ISO
  segment: PatientSegment;
  totalPaid: number;
  visitsCount: number;
  appointmentsCount: number;
  reviewsCount: number;
}

export interface PatientProfile extends Patient {
  appointments: Appointment[];
  payments: PaymentRecord[];
  reviews: Review[];
}

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  amount: number;
  date: string; // ISO
  serviceName: string;
}

/* ───────────────────────────  Appointment  ──────────────────────────────── */
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  status: AppointmentStatus;
  price: number;
  createdAt: string; // ISO
  completedAt: string | null; // ISO — set when status becomes COMPLETED
}

/* ─────────────────────────────  Review  ─────────────────────────────────── */
export interface Review {
  id: string;
  /** A review can only exist for a COMPLETED appointment. */
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  serviceId: string;
  serviceName: string;
  rating: number; // 1–5
  comment: string;
  date: string; // ISO
  visibility: ReviewVisibility;
  reply: string | null;
}

/* ─────────────────────────────  Service  ────────────────────────────────── */
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  active: boolean;
  salesCount: number;
  revenue: number;
  /** Popularity 0–100, relative to the best-selling service. */
  popularity: number;
}

/* ──────────────────────────  Dashboard / KPIs  ──────────────────────────── */
export interface DashboardKpis {
  patientsToday: number;
  appointmentsToday: number;
  newPatients: number;
  cancelledAppointments: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  avgCheck: number;
  /** Clinic load today 0–100 (% capacity). */
  clinicLoad: number;
}

/** Lifetime / executive metrics that never reset. */
export interface ExecutiveKpis {
  clinicHealthScore: number; // 0–100 composite
  totalLifetimeRevenue: number;
  totalLifetimePatients: number;
  totalCompletedAppointments: number;
  averageDoctorRating: number; // 0–5
}

export interface SmartOverview {
  bestDoctor: { id: string; name: string; metric: string };
  topService: { id: string; name: string; metric: string };
  busiestDoctor: { id: string; name: string; metric: string };
  busiestDay: { label: string; metric: string };
  mostProfitableMonth: { label: string; metric: string };
  clinicRating: number; // 0–5
}

export interface DashboardData {
  kpis: DashboardKpis;
  executive: ExecutiveKpis;
  overview: SmartOverview;
  revenueSeries: TimeSeriesPoint[];
  appointmentsSeries: TimeSeriesPoint[];
  recentAppointments: Appointment[];
  latestReviews: Review[];
}

/* ─────────────────────────────  Charts  ─────────────────────────────────── */
export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface CategoryPoint {
  label: string;
  value: number;
}

/* ─────────────────────  Reviews analytics summary  ──────────────────────── */
export interface ReviewAnalytics {
  clinicRating: number; // 0–5
  totalReviews: number;
  ratingDistribution: { stars: number; count: number }[];
  bestDoctors: { id: string; name: string; rating: number; reviews: number }[];
  lowestDoctors: { id: string; name: string; rating: number; reviews: number }[];
}

/* ───────────────────────  Generic query helpers  ────────────────────────── */
export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type DateRangePreset =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";
