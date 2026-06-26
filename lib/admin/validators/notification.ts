import { z } from "zod";

export const notificationMarkAllSchema = z.object({
  markAll: z.literal(true),
});

export const notificationMarkOneSchema = z.object({
  read: z.literal(true),
});

export function parseNotificationBulkPatch(body: unknown):
  | { ok: true; data: { markAll: true } }
  | { ok: false; error: string } {
  const result = notificationMarkAllSchema.safeParse(body);
  if (!result.success) {
    return { ok: false, error: "Нет действия" };
  }
  return { ok: true, data: result.data };
}
