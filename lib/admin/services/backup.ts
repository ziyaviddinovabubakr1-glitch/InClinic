/**
 * Clinic backup — snapshot download / restore via admin API.
 */
import type { ClinicBackupPayload } from "@/lib/clinic-backup";
import { backupSummary } from "@/lib/clinic-backup";

const STORAGE_KEY = "inclinic-backup-latest";

export interface BackupMeta {
  createdAt: string;
  clinicName: string;
  counts: {
    services: number;
    doctors: number;
    patients: number;
    bookings: number;
    reviews: number;
  };
}

async function fetchBackup(): Promise<ClinicBackupPayload> {
  const res = await fetch("/api/admin/backup", { credentials: "include" });
  const data = (await res.json()) as ClinicBackupPayload & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Не удалось создать резервную копию");
  }
  return data;
}

export function saveBackupLocally(backup: ClinicBackupPayload) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
}

export function loadBackupLocally(): ClinicBackupPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClinicBackupPayload;
  } catch {
    return null;
  }
}

export function backupMetaFromPayload(backup: ClinicBackupPayload): BackupMeta {
  return backupSummary(backup);
}

export async function createClinicBackup(): Promise<{ backup: ClinicBackupPayload; meta: BackupMeta }> {
  const backup = await fetchBackup();
  saveBackupLocally(backup);
  return { backup, meta: backupMetaFromPayload(backup) };
}

export async function downloadClinicBackup(existing?: ClinicBackupPayload | null): Promise<BackupMeta> {
  const backup = existing ?? (await fetchBackup());
  saveBackupLocally(backup);
  const meta = backupMetaFromPayload(backup);
  const stamp = backup.createdAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inclinic-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return meta;
}

export async function restoreClinicBackupFromFile(
  backup: ClinicBackupPayload,
): Promise<{ counts: BackupMeta["counts"] }> {
  const res = await fetch("/api/admin/backup", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ backup, confirm: true }),
  });
  const data = (await res.json()) as { error?: string; counts?: BackupMeta["counts"] };
  if (!res.ok) {
    throw new Error(data.error ?? "Не удалось восстановить данные");
  }
  saveBackupLocally(backup);
  return { counts: data.counts! };
}

export function parseBackupFile(text: string): ClinicBackupPayload {
  const parsed = JSON.parse(text) as ClinicBackupPayload;
  if (!parsed?.clinicId || !Array.isArray(parsed.services)) {
    throw new Error("Файл не является резервной копией InClinic");
  }
  return parsed;
}
