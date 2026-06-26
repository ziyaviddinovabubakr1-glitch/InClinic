import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { allowMockFallback, isTelegramConfigured } from "@/lib/env";
import {
  getDefaultClinicId,
  hashPhone,
  validateBookingRequest,
} from "@/lib/booking-rules";
import { createTelegramActionToken } from "@/lib/telegram-actions";
import { findOrCreatePatient } from "@/lib/patients";
import { writeAudit } from "@/lib/audit";
import { createClinicNotification } from "@/lib/notifications-db";
import { getClientIp } from "@/lib/auth-guard";
import { MOCK_SERVICES, MOCK_DOCTORS } from "@/lib/mockData";

interface BookingBody {
  serviceId?: unknown;
  doctorId?: unknown;
  date?: unknown;
  timeSlot?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
}

function validateBooking(body: BookingBody) {
  const errors: string[] = [];
  if (typeof body.serviceId !== "string" || !body.serviceId)
    errors.push("serviceId обязателен");
  if (typeof body.doctorId !== "string" || !body.doctorId)
    errors.push("doctorId обязателен");
  if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date))
    errors.push("Неверный формат даты (YYYY-MM-DD)");
  if (typeof body.timeSlot !== "string" || !/^\d{2}:\d{2}$/.test(body.timeSlot))
    errors.push("Неверный формат времени (HH:MM)");
  if (typeof body.firstName !== "string" || body.firstName.length < 2 || body.firstName.length > 50)
    errors.push("Имя должно содержать 2–50 символов");
  if (typeof body.lastName !== "string" || body.lastName.length < 2 || body.lastName.length > 50)
    errors.push("Фамилия должна содержать 2–50 символов");
  if (typeof body.phone !== "string" || body.phone.length < 7 || body.phone.length > 20)
    errors.push("Неверный номер телефона");
  return errors;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(
    "bookings",
    ip,
    RATE_LIMITS.bookings.limit,
    RATE_LIMITS.bookings.windowMs
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 }
    );
  }

  let body: BookingBody;
  try {
    body = (await request.json()) as BookingBody;
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const errors = validateBooking(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 422 });
  }

  const { serviceId, doctorId, date, timeSlot, firstName, lastName, phone } = body as {
    serviceId: string;
    doctorId: string;
    date: string;
    timeSlot: string;
    firstName: string;
    lastName: string;
    phone: string;
  };

  const formattedDate = `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`;

  try {
    const clinicId = await getDefaultClinicId();
    const rules = await validateBookingRequest({
      clinicId,
      serviceId,
      doctorId,
      date,
      timeSlot,
      phone,
    });
    if (!rules.ok) {
      return NextResponse.json({ error: rules.error }, { status: rules.status });
    }

    const patient = await findOrCreatePatient({
      clinicId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    });

    const booking = await prisma.booking.create({
      data: {
        clinicId,
        patientId: patient.id,
        serviceId,
        doctorId,
        date,
        timeSlot,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        phoneHash: hashPhone(phone),
      },
      include: { service: true, doctor: true },
    });

    const confirmToken = await createTelegramActionToken(booking.id, "confirm");
    const rejectToken = await createTelegramActionToken(booking.id, "reject");

    const text =
      `🏥 <b>Новая заявка на запись</b>\n\n` +
      `👤 <b>Пациент:</b> ${escapeHtml(firstName)} ${escapeHtml(lastName)}\n` +
      `📞 <b>Телефон:</b> ${escapeHtml(phone)}\n` +
      `🩺 <b>Услуга:</b> ${escapeHtml(booking.service.nameRu)}\n` +
      `👨‍⚕️ <b>Врач:</b> ${escapeHtml(booking.doctor.nameRu)}\n` +
      `📅 <b>Дата:</b> ${formattedDate}\n` +
      `🕐 <b>Время:</b> ${timeSlot}`;

    const keyboard = {
      inline_keyboard: [[
        { text: "✅ Подтвердить", callback_data: confirmToken },
        { text: "❌ Отклонить", callback_data: rejectToken },
      ]],
    };

    if (isTelegramConfigured()) {
      try {
        const msgId = await sendMessage(text, keyboard);
        await prisma.booking.update({
          where: { id: booking.id },
          data: { tgMessageId: msgId },
        });
      } catch (tgErr) {
        console.error("[bookings] Telegram sendMessage failed:", tgErr);
      }
    } else {
      console.warn("[bookings] Telegram не настроен — уведомление не отправлено");
    }

    await writeAudit({
      clinicId,
      action: "booking.create",
      entity: "booking",
      entityId: booking.id,
      ip,
      metadata: { patientId: patient.id },
    });

    try {
      await createClinicNotification({
        clinicId,
        type: "booking",
        title: "Новая запись",
        message: `${firstName.trim()} ${lastName.trim()} · ${booking.service.nameRu} · ${formattedDate} ${timeSlot}`,
      });
    } catch (notifyErr) {
      console.error("[bookings] notification failed:", notifyErr);
    }

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          status: booking.status,
          date: formattedDate,
          dateIso: date,
          timeSlot,
          service: booking.service.nameRu,
          doctor: booking.doctor.nameRu,
          doctorSpecialty: booking.doctor.specialtyRu,
          firstName: booking.firstName,
          lastName: booking.lastName,
          phone: booking.phone,
          price: booking.service.price,
          paid: false,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    if (!allowMockFallback()) {
      console.error("[bookings] error:", e);
      return NextResponse.json(
        { error: "Сервис временно недоступен" },
        { status: 503 }
      );
    }

    const service = MOCK_SERVICES.find((s) => s.id === serviceId);
    const doctor = MOCK_DOCTORS.find((d) => d.id === doctorId);
    if (!service || !doctor) {
      return NextResponse.json({ error: "Услуга или врач не найдены" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: `mock-${Date.now()}`,
          status: "PENDING",
          date: formattedDate,
          dateIso: date,
          timeSlot,
          service: service.nameRu,
          doctor: doctor.nameRu,
          doctorSpecialty: doctor.specialtyRu,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          price: service.price ?? null,
          paid: false,
        },
      },
      { status: 201 }
    );
  }
}
