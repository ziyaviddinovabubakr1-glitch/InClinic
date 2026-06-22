import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { editMessage, sendMessage, answerCallbackQuery } from "@/lib/telegram";
import {
  consumeTelegramActionToken,
  consumePendingReject,
  isTelegramIp,
  setPendingReject,
  verifyTelegramChat,
} from "@/lib/telegram-actions";
import { getTelegramWebhookSecret } from "@/lib/env";
import { writeAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/auth-guard";

interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    from: { id: number; first_name: string };
    message: { message_id: number; chat: { id: number } };
    data: string;
  };
  message?: {
    message_id: number;
    from: { id: number };
    chat: { id: number };
    text: string;
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function logWebhook(msg: string) {
  console.log("[telegram/webhook]", msg);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  const expected = getTelegramWebhookSecret();

  if (!expected || secret !== expected) {
    logWebhook(`403: secret mismatch (got ${secret ? "set" : "missing"}, expected configured)`);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  /* Secret token is Telegram's official auth — do not block Render/proxy IPs */
  if (!isTelegramIp(ip)) {
    logWebhook(`note: client IP ${ip} not in Telegram ranges (secret ok, allowing)`);
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (update.message) {
    const msg = update.message;
    const chatId = String(msg.chat.id);
    const userId = String(msg.from.id);

    if (!verifyTelegramChat(chatId)) {
      logWebhook(`ignored message from chat ${chatId} (expected TELEGRAM_CHAT_ID)`);
      return NextResponse.json({ ok: true });
    }

    const text = msg.text?.trim() ?? "";

    const pendingBookingId = await consumePendingReject(chatId, userId);
    if (pendingBookingId) {
      try {
        const booking = await prisma.booking.update({
          where: { id: pendingBookingId },
          data: { status: "REJECTED", rejectionReason: text.slice(0, 500) },
          include: { service: true, doctor: true },
        });

        await writeAudit({
          clinicId: booking.clinicId,
          action: "booking.reject.telegram",
          entity: "booking",
          entityId: booking.id,
          ip,
        });

        if (booking.tgMessageId) {
          const [d, m, y] = [
            booking.date.slice(8),
            booking.date.slice(5, 7),
            booking.date.slice(0, 4),
          ];
          await editMessage(
            booking.tgMessageId,
            `❌ <b>Запись отклонена</b>\n\n` +
              `👤 ${escapeHtml(booking.firstName)} ${escapeHtml(booking.lastName)}\n` +
              `🩺 ${escapeHtml(booking.service.nameRu)}\n` +
              `📅 ${d}.${m}.${y} ${booking.timeSlot}\n` +
              `💬 <b>Причина:</b> ${escapeHtml(text || "—")}`
          );
        } else {
          await sendMessage(
            `❌ Запись отклонена: ${escapeHtml(booking.firstName)} ${escapeHtml(booking.lastName)}`
          );
        }
      } catch (e) {
        console.error("[telegram/webhook] reject reason error:", e);
        await sendMessage("⚠️ Ошибка при обновлении заявки.").catch(() => {});
      }
      return NextResponse.json({ ok: true });
    }

    if (text === "/start" || text === "Меню") {
      const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME ?? "InClinic";
      await sendMessage(
        `👋 Добро пожаловать в <b>${escapeHtml(clinicName)}</b>!\n\n` +
          `Здесь вы получаете заявки на запись.\n` +
          `Нажимайте «Подтвердить» или «Отклонить» под сообщением.`
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (!update.callback_query) return NextResponse.json({ ok: true });

  const cb = update.callback_query;
  const chatId = String(cb.message.chat.id);
  const userId = String(cb.from.id);

  if (!verifyTelegramChat(chatId)) {
    logWebhook(`ignored callback from chat ${chatId}`);
    return NextResponse.json({ ok: true });
  }

  const actionPayload = await consumeTelegramActionToken(cb.data ?? "");
  if (!actionPayload) {
    await answerCallbackQuery(cb.id, "Действие устарело или уже использовано");
    return NextResponse.json({ ok: true });
  }

  const { bookingId, action } = actionPayload;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, doctor: true },
    });

    if (!booking || booking.status !== "PENDING") {
      await answerCallbackQuery(cb.id, "Заявка уже обработана");
      return NextResponse.json({ ok: true });
    }

    const formattedDate = `${booking.date.slice(8, 10)}.${booking.date.slice(5, 7)}.${booking.date.slice(0, 4)}`;

    if (action === "confirm") {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "ACCEPTED" },
      });

      await writeAudit({
        clinicId: booking.clinicId,
        action: "booking.confirm.telegram",
        entity: "booking",
        entityId: booking.id,
        ip,
      });

      if (booking.tgMessageId) {
        await editMessage(
          booking.tgMessageId,
          `✅ <b>Запись подтверждена</b>\n\n` +
            `👤 ${escapeHtml(booking.firstName)} ${escapeHtml(booking.lastName)}\n` +
            `📞 ${escapeHtml(booking.phone)}\n` +
            `🩺 ${escapeHtml(booking.service.nameRu)}\n` +
            `👨‍⚕️ ${escapeHtml(booking.doctor.nameRu)}\n` +
            `📅 ${formattedDate} в ${booking.timeSlot}`
        );
      }

      await answerCallbackQuery(cb.id, "Запись подтверждена ✓");
    } else if (action === "reject") {
      await setPendingReject(chatId, userId, bookingId);
      await sendMessage(
        `✏️ Введите причину отклонения заявки:\n<b>${escapeHtml(booking.firstName)} ${escapeHtml(booking.lastName)}</b> (${formattedDate} ${booking.timeSlot})`
      );
      await answerCallbackQuery(cb.id, "Напишите причину отклонения");
    }
  } catch (e) {
    console.error("[telegram/webhook] callback error:", e);
    await answerCallbackQuery(cb.id, "Ошибка сервера");
  }

  return NextResponse.json({ ok: true });
}
