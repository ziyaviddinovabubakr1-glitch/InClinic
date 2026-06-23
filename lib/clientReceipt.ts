export type ReceiptStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";

export interface ClientReceipt {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  service: string;
  doctor: string;
  doctorSpecialty?: string;
  dateIso: string;
  dateFormatted: string;
  timeSlot: string;
  price: number | null;
  paid: boolean;
  status?: ReceiptStatus;
  rejectionReason?: string | null;
  createdAt: string;
}

const STORAGE_KEY = "inclinic-receipts";

export function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadAllReceipts(): ClientReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClientReceipt[];
    return parsed.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

/** Активные записи (предстоящие, не отклонённые). */
export function loadReceipts(): ClientReceipt[] {
  return loadAllReceipts().filter(isUpcomingReceipt);
}

export function isUpcomingReceipt(receipt: ClientReceipt): boolean {
  const status = receipt.status ?? "PENDING";
  return receipt.dateIso >= getTodayIso() && status !== "REJECTED";
}

export function isCompletedReceipt(receipt: ClientReceipt): boolean {
  const status = receipt.status ?? "ACCEPTED";
  if (status === "REJECTED") return false;
  return receipt.dateIso < getTodayIso() || status === "COMPLETED";
}

export function isRejectedReceipt(receipt: ClientReceipt): boolean {
  return receipt.status === "REJECTED";
}

export function saveReceipt(receipt: ClientReceipt): void {
  const existing = loadAllReceipts();
  const updated = [receipt, ...existing.filter((r) => r.id !== receipt.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("inclinic-receipt-updated"));
}

export function removeReceipt(id: string): void {
  const existing = loadAllReceipts();
  const updated = existing.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("inclinic-receipt-updated"));
}

export function updateReceiptStatus(
  id: string,
  status: ReceiptStatus,
  rejectionReason?: string | null
): void {
  const existing = loadAllReceipts();
  const updated = existing.map((r) =>
    r.id === id ? { ...r, status, rejectionReason: rejectionReason ?? null } : r
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("inclinic-receipt-updated"));
}
