import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "booking"
  | "cancel"
  | "review"
  | "patient"
  | "system";

export async function createClinicNotification(input: {
  clinicId: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: string | null;
}) {
  return prisma.notification.create({
    data: {
      clinicId: input.clinicId,
      type: input.type,
      title: input.title,
      message: input.message,
      userId: input.userId ?? null,
    },
  });
}
