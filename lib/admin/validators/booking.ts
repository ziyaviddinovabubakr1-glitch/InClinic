import { z } from "zod";

const uiStatus = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);
const dbStatus = z.enum(["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"]);

export const bookingPatchSchema = z.object({
  id: z.string().trim().min(1, "id обязателен"),
  status: z.union([uiStatus, dbStatus], {
    error: "Некорректный status",
  }),
  rejectionReason: z.string().max(500).optional(),
});

export type BookingPatchInput = z.infer<typeof bookingPatchSchema>;

export function parseBookingPatch(body: unknown):
  | { ok: true; data: BookingPatchInput }
  | { ok: false; error: string } {
  const result = bookingPatchSchema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: issue?.message ?? "Неверный запрос" };
  }
  return { ok: true, data: result.data };
}
