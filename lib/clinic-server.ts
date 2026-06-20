import { prisma } from "@/lib/prisma";

export async function resolvePublicClinicId(): Promise<string | null> {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "default";
  const clinic = await prisma.clinic.findUnique({ where: { slug } });
  return clinic?.id ?? null;
}
