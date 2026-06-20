/**
 * Central mock dataset.
 *
 * Builds a single, internally-consistent universe of doctors → appointments →
 * patients → reviews → revenue, generated once with a fixed seed and cached.
 * This module is PRIVATE to the service layer: UI must never import it.
 * Services in `lib/admin/services` read from here and shape the responses.
 */
import type {
  Appointment,
  AppointmentStatus,
  Doctor,
  Patient,
  PatientSegment,
  PaymentRecord,
  Review,
  ReviewVisibility,
  Service,
} from "@/lib/admin/types";
import { createRng, rngFloat, rngInt, rngPick } from "./rng";

const SEED = 20260614;

const FIRST_NAMES = [
  "Алишер", "Дилноза", "Бахром", "Манижа", "Рустам", "Зарина", "Фаррух",
  "Гулнора", "Сухроб", "Малика", "Джамшед", "Нигина", "Икром", "Сабина",
  "Хуршед", "Мадина", "Парвиз", "Шахло", "Темур", "Лола",
];
const LAST_NAMES = [
  "Каримов", "Рахимова", "Назаров", "Юсупова", "Холов", "Саидова",
  "Мирзоев", "Турсунова", "Эргашев", "Шарипова", "Додов", "Алиева",
  "Сафаров", "Бекова", "Усмонов", "Раджабова",
];

const SPECIALTIES = [
  "Терапевт", "Кардиолог", "Невролог", "Дерматолог", "Офтальмолог",
  "Эндокринолог", "Гастроэнтеролог", "Педиатр", "Хирург", "ЛОР",
];

const EDUCATION = [
  "Таджикский государственный медицинский университет им. Абуали ибни Сино",
  "Российский национальный исследовательский медицинский университет",
  "Первый МГМУ им. И. М. Сеченова",
  "Казахский национальный медицинский университет",
];

const LANGUAGES = ["Русский", "Таджикский", "Английский", "Узбекский"];

const SERVICE_DEFS = [
  { name: "Консультация терапевта", price: 150, duration: 30 },
  { name: "Консультация кардиолога", price: 220, duration: 40 },
  { name: "УЗИ диагностика", price: 180, duration: 30 },
  { name: "ЭКГ с расшифровкой", price: 120, duration: 20 },
  { name: "Консультация невролога", price: 200, duration: 40 },
  { name: "Лабораторные анализы", price: 90, duration: 15 },
  { name: "Консультация дерматолога", price: 170, duration: 30 },
  { name: "Офтальмологический осмотр", price: 160, duration: 30 },
];

interface Dataset {
  doctors: Doctor[];
  services: Service[];
  patients: Patient[];
  appointments: Appointment[];
  reviews: Review[];
  payments: PaymentRecord[];
}

let cached: Dataset | null = null;

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function isoDaysAgo(daysAgo: number, hour = 10, minute = 0): string {
  const base = new Date(2026, 5, 14, hour, minute, 0); // fixed "now" = 2026-06-14
  base.setDate(base.getDate() - daysAgo);
  return base.toISOString();
}

function dateStr(daysFromNow: number): string {
  const base = new Date(2026, 5, 14);
  base.setDate(base.getDate() + daysFromNow);
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
}

function build(): Dataset {
  const rng = createRng(SEED);

  /* ── Services ─────────────────────────────────────────── */
  const services: Service[] = SERVICE_DEFS.map((def, i) => ({
    id: `svc-${i + 1}`,
    name: def.name,
    description: `${def.name} — профессиональный приём и диагностика в клинике InClinic.`,
    price: def.price,
    durationMin: def.duration,
    active: true,
    salesCount: 0,
    revenue: 0,
    popularity: 0,
  }));

  /* ── Doctors ──────────────────────────────────────────── */
  const doctors: Doctor[] = Array.from({ length: 9 }, (_, i) => {
    const first = rngPick(rng, FIRST_NAMES);
    const last = rngPick(rng, LAST_NAMES);
    const langCount = rngInt(rng, 2, 3);
    const langs = [...LANGUAGES].slice(0, langCount);
    return {
      id: `doc-${i + 1}`,
      photoUrl: null,
      fullName: `${last} ${first}`,
      specialty: SPECIALTIES[i % SPECIALTIES.length],
      experienceYears: rngInt(rng, 3, 28),
      education: rngPick(rng, EDUCATION),
      languages: langs,
      consultationPrice: rngInt(rng, 12, 30) * 10,
      workSchedule: {
        days: rng() > 0.4 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6],
        start: rng() > 0.5 ? "08:00" : "09:00",
        end: rng() > 0.5 ? "17:00" : "18:00",
      },
      status: i === 8 ? "HIDDEN" : "ACTIVE",
      rating: 0,
      patientsCount: 0,
      appointmentsCount: 0,
      revenueGenerated: 0,
      createdAt: isoDaysAgo(rngInt(rng, 200, 900)),
    };
  });

  /* ── Patients ─────────────────────────────────────────── */
  const patients: Patient[] = Array.from({ length: 64 }, (_, i) => {
    const first = rngPick(rng, FIRST_NAMES);
    const last = rngPick(rng, LAST_NAMES);
    const registeredDaysAgo = rngInt(rng, 0, 720);
    return {
      id: `pat-${i + 1}`,
      fullName: `${last} ${first}`,
      phone: `+992 ${rngInt(rng, 90, 98)} ${rngInt(rng, 100, 999)}-${rngInt(rng, 10, 99)}-${rngInt(rng, 10, 99)}`,
      email: `patient${i + 1}@mail.tj`,
      registeredAt: isoDaysAgo(registeredDaysAgo),
      lastVisitAt: null,
      segment: "NEW",
      totalPaid: 0,
      visitsCount: 0,
      appointmentsCount: 0,
      reviewsCount: 0,
    };
  });

  /* ── Appointments (the historical backbone) ───────────── */
  const appointments: Appointment[] = [];
  const payments: PaymentRecord[] = [];
  const reviews: Review[] = [];

  const statusRoll = (daysFromNow: number): AppointmentStatus => {
    if (daysFromNow > 0) return rng() > 0.25 ? "CONFIRMED" : "PENDING";
    if (daysFromNow === 0) return rngPick(rng, ["PENDING", "CONFIRMED", "CONFIRMED"]);
    // past
    const r = rng();
    if (r < 0.78) return "COMPLETED";
    if (r < 0.9) return "CANCELLED";
    return "CONFIRMED";
  };

  let apptCounter = 0;
  // Spread appointments across the last ~180 days and the next 10 days.
  for (let daysFromNow = -180; daysFromNow <= 10; daysFromNow++) {
    const perDay = daysFromNow <= 0 ? rngInt(rng, 1, 5) : rngInt(rng, 0, 3);
    for (let k = 0; k < perDay; k++) {
      apptCounter++;
      const doctor = rngPick(rng, doctors);
      const patient = rngPick(rng, patients);
      const svcIndex = rngInt(rng, 0, services.length - 1);
      const service = services[svcIndex];
      const status = statusRoll(daysFromNow);
      const hour = rngInt(rng, 8, 17);
      const minute = rng() > 0.5 ? 30 : 0;
      const id = `apt-${apptCounter}`;
      const completedAt =
        status === "COMPLETED" ? isoDaysAgo(-daysFromNow, hour, minute) : null;

      appointments.push({
        id,
        patientId: patient.id,
        patientName: patient.fullName,
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        serviceId: service.id,
        serviceName: service.name,
        date: dateStr(daysFromNow),
        time: `${pad(hour)}:${pad(minute)}`,
        status,
        price: service.price,
        createdAt: isoDaysAgo(-daysFromNow + rngInt(rng, 0, 3)),
        completedAt,
      });

      if (status === "COMPLETED") {
        // Revenue + history preservation
        payments.push({
          id: `pay-${id}`,
          appointmentId: id,
          amount: service.price,
          date: completedAt as string,
          serviceName: service.name,
        });
        service.salesCount++;
        service.revenue += service.price;
        doctor.appointmentsCount++;
        doctor.revenueGenerated += service.price;
        patient.appointmentsCount++;
        patient.visitsCount++;
        patient.totalPaid += service.price;
        if (!patient.lastVisitAt || completedAt! > patient.lastVisitAt) {
          patient.lastVisitAt = completedAt;
        }

        // ~55% of completed appointments get a review
        if (rng() < 0.55) {
          const rating = rngPick(rng, [3, 4, 4, 5, 5, 5, 5, 2]);
          const visibility = rngPick<ReviewVisibility>(rng, [
            "PUBLISHED", "PUBLISHED", "PUBLISHED", "PENDING", "HIDDEN",
          ]);
          reviews.push({
            id: `rev-${id}`,
            appointmentId: id,
            doctorId: doctor.id,
            doctorName: doctor.fullName,
            patientId: patient.id,
            patientName: patient.fullName,
            serviceId: service.id,
            serviceName: service.name,
            rating,
            comment: REVIEW_COMMENTS[rating] ?? "Спасибо за приём.",
            date: completedAt as string,
            visibility,
            reply: rng() < 0.25 ? "Благодарим за ваш отзыв! Ждём вас снова." : null,
          });
          patient.reviewsCount++;
        }
      } else if (status !== "CANCELLED") {
        doctor.appointmentsCount++;
        patient.appointmentsCount++;
      }
    }
  }

  /* ── Derive doctor ratings & patient counts ───────────── */
  for (const doctor of doctors) {
    const docReviews = reviews.filter((r) => r.doctorId === doctor.id);
    doctor.rating = docReviews.length
      ? Math.round(
          (docReviews.reduce((s, r) => s + r.rating, 0) / docReviews.length) * 10,
        ) / 10
      : rngFloat(rng, 4.2, 4.9, 1);
    doctor.patientsCount = new Set(
      appointments.filter((a) => a.doctorId === doctor.id).map((a) => a.patientId),
    ).size;
  }

  /* ── Segment patients ─────────────────────────────────── */
  for (const patient of patients) {
    patient.segment = segmentOf(patient);
  }

  /* ── Service popularity (relative to best seller) ─────── */
  const maxSales = Math.max(1, ...services.map((s) => s.salesCount));
  for (const service of services) {
    service.popularity = Math.round((service.salesCount / maxSales) * 100);
  }

  return { doctors, services, patients, appointments, reviews, payments };
}

const REVIEW_COMMENTS: Record<number, string> = {
  5: "Прекрасный врач! Внимательный, всё подробно объяснил. Рекомендую.",
  4: "Хороший приём, остался доволен. Немного подождал в очереди.",
  3: "В целом нормально, но хотелось бы больше внимания.",
  2: "Ожидал большего. Приём прошёл слишком быстро.",
  1: "Не понравилось обслуживание.",
};

function segmentOf(p: Patient): PatientSegment {
  const now = new Date(2026, 5, 14).getTime();
  const lastVisit = p.lastVisitAt ? new Date(p.lastVisitAt).getTime() : 0;
  const daysSinceVisit = lastVisit ? (now - lastVisit) / 86_400_000 : Infinity;

  if (p.totalPaid >= 1200 || p.visitsCount >= 8) return "VIP";
  if (daysSinceVisit > 180) return "INACTIVE";
  if (p.visitsCount >= 3) return "REGULAR";
  return "NEW";
}

/** Returns the cached singleton dataset (built once). */
export function getDataset(): Dataset {
  if (!cached) cached = build();
  return cached;
}
