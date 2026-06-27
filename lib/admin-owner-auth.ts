import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { allowDevCredentials, getDevAdminCredentials } from "@/lib/env";

type OwnerWithClinic = User & {
  clinic: { id: string; name: string; slug: string };
};

export function getConfiguredOwnerCredentials(): { username: string; password: string } | null {
  if (allowDevCredentials()) {
    const dev = getDevAdminCredentials();
    return {
      username: (process.env.ADMIN_USERNAME ?? dev.username).trim(),
      password: (process.env.ADMIN_PASSWORD ?? dev.password).trim(),
    };
  }

  const envUser = process.env.ADMIN_USERNAME?.trim();
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  if (envUser && envPass) {
    return { username: envUser, password: envPass };
  }
  return null;
}

export async function syncOwnerFromCredentials(username: string, plainPassword: string) {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "default";
  const clinic =
    (await prisma.clinic.findUnique({ where: { slug } })) ??
    (await prisma.clinic.create({
      data: { slug, name: process.env.NEXT_PUBLIC_CLINIC_NAME ?? "InClinic" },
    }));

  await prisma.user.updateMany({
    where: { role: "OWNER", username: { not: username } },
    data: { active: false },
  });

  const passwordHash = await hashPassword(plainPassword);
  return prisma.user.upsert({
    where: { username },
    update: { passwordHash, role: "OWNER", clinicId: clinic.id, active: true },
    create: {
      username,
      passwordHash,
      role: "OWNER",
      clinicId: clinic.id,
      active: true,
    },
    include: { clinic: true },
  });
}

async function activateOwnerIfNeeded(user: OwnerWithClinic): Promise<OwnerWithClinic> {
  if (user.active) return user;
  return prisma.user.update({
    where: { id: user.id },
    data: { active: true },
    include: { clinic: true },
  });
}

async function findOwnerByUsername(username: string) {
  const normalized = username.trim();
  if (!normalized) return null;

  let user = await prisma.user.findUnique({
    where: { username: normalized },
    include: { clinic: true },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: {
        username: { equals: normalized, mode: "insensitive" },
        role: "OWNER",
      },
      include: { clinic: true },
    });
  }

  return user;
}

export async function authenticateOwner(username: string, password: string) {
  const plain = password.trim();
  if (!plain) return null;

  const matched = await findOwnerByUsername(username);
  if (matched?.passwordHash && (await verifyPassword(plain, matched.passwordHash))) {
    return activateOwnerIfNeeded(matched);
  }

  const owners = await prisma.user.findMany({
    where: { role: "OWNER" },
    include: { clinic: true },
  });

  for (const owner of owners) {
    if (!owner.passwordHash) continue;
    if (!(await verifyPassword(plain, owner.passwordHash))) continue;
    return activateOwnerIfNeeded(owner);
  }

  const configured = getConfiguredOwnerCredentials();
  if (configured && plain === configured.password) {
    return syncOwnerFromCredentials(configured.username, plain);
  }

  if (allowDevCredentials() && configured && owners.length === 0) {
    return syncOwnerFromCredentials(configured.username, configured.password);
  }

  return null;
}
