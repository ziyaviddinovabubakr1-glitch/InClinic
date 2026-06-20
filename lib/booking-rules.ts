import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots, filterPastSlots } from "@/lib/slots";
import { getBookingMaxHorizonDays } from "@/lib/env";

export function hashPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, "");
  return createHash("sha256").update(normalized).digest("hex");
}

export function parseDateOnly(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function isPastDate(date: string): boolean {
  const d = parseDateOnly(date);
  if (!d) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export function isBeyondHorizon(date: string): boolean {
  const d = parseDateOnly(date);
  if (!d) return true;
  const max = new Date();
  max.setDate(max.getDate() + getBookingMaxHorizonDays());
  return d > max;
}

export function isValidTimeSlot(
  timeSlot: string,
  workStart: string,
  workEnd: string
): boolean {
  const slots = generateTimeSlots(workStart, workEnd);
  const available = filterPastSlots(
    new Date().toISOString().slice(0, 10),
    slots
  );
  if (!slots.includes(timeSlot)) return false;
  return slots.includes(timeSlot);
}

export async function validateBookingRequest(input: {
  clinicId: string;
  serviceId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  phone: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (isPastDate(input.date)) {
    return { ok: false, error: "Нельзя записаться на прошедшую дату", status: 422 };
  }
  if (isBeyondHorizon(input.date)) {
    return {
      ok: false,
      error: `Запись возможна не более чем на ${getBookingMaxHorizonDays()} дней вперёд`,
      status: 422,
    };
  }

  const [service, doctor, link] = await Promise.all([
    prisma.service.findFirst({
      where: { id: input.serviceId, clinicId: input.clinicId, active: true },
    }),
    prisma.doctor.findFirst({
      where: { id: input.doctorId, clinicId: input.clinicId, active: true },
    }),
    prisma.doctorService.findFirst({
      where: { doctorId: input.doctorId, serviceId: input.serviceId },
    }),
  ]);

  if (!service || !doctor) {
    return { ok: false, error: "Услуга или врач не найдены", status: 404 };
  }
  if (!link) {
    return {
      ok: false,
      error: "Выбранный врач не оказывает эту услугу",
      status: 422,
    };
  }

  const dow = new Date(`${input.date}T12:00:00`).getDay();
  if (!doctor.workDays.includes(dow)) {
    return { ok: false, error: "Врач не принимает в этот день", status: 422 };
  }

  const slots = generateTimeSlots(doctor.workStart, doctor.workEnd);
  if (!slots.includes(input.timeSlot)) {
    return { ok: false, error: "Недопустимое время приёма", status: 422 };
  }

  const available = filterPastSlots(input.date, slots);
  if (!available.includes(input.timeSlot)) {
    return { ok: false, error: "Это время уже прошло", status: 422 };
  }

  const conflict = await prisma.booking.findFirst({
    where: {
      clinicId: input.clinicId,
      doctorId: input.doctorId,
      date: input.date,
      timeSlot: input.timeSlot,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });
  if (conflict) {
    return {
      ok: false,
      error: "Это время уже занято. Пожалуйста, выберите другое.",
      status: 409,
    };
  }

  const phoneHash = hashPhone(input.phone);
  const recentDup = await prisma.booking.findFirst({
    where: {
      clinicId: input.clinicId,
      phoneHash,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });
  if (recentDup) {
    return {
      ok: false,
      error: "Заявка с этим номером уже создана недавно. Подождите или позвоните в клинику.",
      status: 429,
    };
  }

  return { ok: true };
}

export async function getDefaultClinicId(): Promise<string> {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "default";
  const clinic = await prisma.clinic.findUnique({ where: { slug } });
  if (clinic) return clinic.id;
  throw new Error("Default clinic not found — run prisma db seed");
}
