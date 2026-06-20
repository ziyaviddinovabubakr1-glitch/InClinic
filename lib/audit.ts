import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface AuditEntry {
  userId?: string | null;
  clinicId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        clinicId: entry.clinicId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        ip: entry.ip ?? null,
        metadata: entry.metadata ?? undefined,
      },
    });
  } catch (e) {
    console.error("[audit] failed to write log:", e);
  }
}
