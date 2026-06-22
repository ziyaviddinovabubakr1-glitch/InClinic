const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboard {
  inline_keyboard: InlineKeyboardButton[][];
}

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  result?: {
    message_id?: number;
    url?: string;
    last_error_message?: string;
  };
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  return token;
}

function getChatId(): string {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID is not set");
  }
  return chatId;
}

export async function sendMessage(
  text: string,
  replyMarkup?: InlineKeyboard
): Promise<number> {
  const token = getBotToken();
  const chatId = getChatId();

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as TelegramApiResponse;

  if (!response.ok || !data.ok || !data.result?.message_id) {
    throw new Error(`Telegram sendMessage failed: ${JSON.stringify(data)}`);
  }

  return data.result.message_id;
}

export async function editMessage(
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard
): Promise<void> {
  const token = getBotToken();
  const chatId = getChatId();

  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(`${TELEGRAM_API_BASE}${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as TelegramApiResponse;

  if (!response.ok || !data.ok) {
    throw new Error(`Telegram editMessage failed: ${JSON.stringify(data)}`);
  }
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  const token = getBotToken();
  const body: Record<string, unknown> = { callback_query_id: callbackQueryId };
  if (text) body.text = text;

  await fetch(`${TELEGRAM_API_BASE}${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export async function setWebhook(
  webhookUrl: string,
  secretToken: string
): Promise<void> {
  const token = getBotToken();
  const response = await fetch(`${TELEGRAM_API_BASE}${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secretToken,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
  });
  const data = (await response.json()) as TelegramApiResponse;
  if (!data.ok) {
    throw new Error(`setWebhook failed: ${data.description ?? JSON.stringify(data)}`);
  }
}

export async function getWebhookInfo(): Promise<TelegramApiResponse["result"]> {
  const token = getBotToken();
  const response = await fetch(`${TELEGRAM_API_BASE}${token}/getWebhookInfo`);
  const data = (await response.json()) as TelegramApiResponse;
  if (!data.ok) throw new Error("getWebhookInfo failed");
  return data.result;
}
