/**
 * Sync OWNER account from ADMIN_USERNAME / ADMIN_PASSWORD env vars.
 * Used on deploy seed, server start, and manual reset.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DEFAULT_USER = "InClinic";
const DEFAULT_PASS = "OwnerSecure2026!";

export function getAdminCredentialsFromEnv() {
  const username = (process.env.ADMIN_USERNAME ?? DEFAULT_USER).trim();
  const password = (process.env.ADMIN_PASSWORD ?? DEFAULT_PASS).trim();
  if (!username) {
    throw new Error("ADMIN_USERNAME is empty");
  }
  if (!password || password.length < 6) {
    throw new Error("ADMIN_PASSWORD must be at least 6 characters");
  }
  return { username, password };
}

/** @param {PrismaClient} [client] */
export async function syncAdminFromEnv(client) {
  const prisma = client ?? new PrismaClient();
  const ownsClient = !client;

  try {
    const { username, password } = getAdminCredentialsFromEnv();
    const passwordHash = await bcrypt.hash(password, 12);
    const slug = process.env.DEFAULT_CLINIC_SLUG ?? "default";

    const clinic = await prisma.clinic.upsert({
      where: { slug },
      update: {},
      create: { slug, name: process.env.NEXT_PUBLIC_CLINIC_NAME ?? "InClinic" },
    });

    await prisma.user.updateMany({
      where: { role: "OWNER", username: { not: username } },
      data: { active: false },
    });

    await prisma.user.upsert({
      where: { username },
      update: { passwordHash, role: "OWNER", clinicId: clinic.id, active: true },
      create: {
        username,
        passwordHash,
        role: "OWNER",
        clinicId: clinic.id,
        active: true,
      },
    });

    console.log(`→ Admin synced: username "${username}" (from ADMIN_USERNAME env)`);
    return { username };
  } finally {
    if (ownsClient) await prisma.$disconnect();
  }
}
