import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { allowDevCredentials, getDevAdminCredentials } from "@/lib/env";

type OwnerWithClinic = User & {
  clinic: { id: string; name: string; slug: string };
};

function normalizeUsername(value: string): string {
  return value.trim();
}

function usernamesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

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
  const normalized = normalizeUsername(username);
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

  if (user?.role !== "OWNER") return null;
  return user;
}

export async function authenticateOwner(username: string, password: string) {
  const plain = password.trim();
  const name = normalizeUsername(username);
  if (!plain || !name) return null;

  const configured = getConfiguredOwnerCredentials();

  if (configured) {
    const configuredUserMatch = usernamesMatch(name, configured.username);
    const configuredPassMatch = plain === configured.password;
    if (configuredUserMatch && configuredPassMatch) {
      return syncOwnerFromCredentials(configured.username, plain);
    }
  }

  const matched = await findOwnerByUsername(name);
  if (matched?.passwordHash && (await verifyPassword(plain, matched.passwordHash))) {
    return activateOwnerIfNeeded(matched);
  }

  if (configured && plain === configured.password) {
    return syncOwnerFromCredentials(configured.username, plain);
  }

  if (allowDevCredentials() && configured) {
    const ownerCount = await prisma.user.count({
      where: { role: "OWNER", active: true },
    });
    if (ownerCount === 0) {
      return syncOwnerFromCredentials(configured.username, configured.password);
    }
  }

  return null;
}
