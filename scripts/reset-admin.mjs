/**
 * Reset OWNER login to ADMIN_USERNAME / ADMIN_PASSWORD from env (or defaults).
 * Run on Render Shell: node scripts/reset-admin.mjs
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DEFAULT_USER = "Abubakr";
const DEFAULT_PASS = "InClinic2026!";

const prisma = new PrismaClient();

async function main() {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "default";
  const username = (process.env.ADMIN_USERNAME ?? DEFAULT_USER).trim();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASS;
  const passwordHash = await bcrypt.hash(password, 12);

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

  console.log(`OWNER reset OK → username: "${username}"`);
  console.log("Password set from ADMIN_PASSWORD env (or project default).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
