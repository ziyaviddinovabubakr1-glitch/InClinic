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

/** Удаляем чеки, день приёма которых уже прошёл */
export function purgeExpiredReceipts(receipts: ClientReceipt[]): ClientReceipt[] {
  const today = getTodayIso();
  return receipts.filter((r) => r.dateIso >= today);
}

export function loadReceipts(): ClientReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClientReceipt[];
    const active = purgeExpiredReceipts(parsed);
    if (active.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    }
    return active;
  } catch {
    return [];
  }
}

export function saveReceipt(receipt: ClientReceipt): void {
  const existing = loadReceipts();
  const updated = [receipt, ...existing.filter((r) => r.id !== receipt.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("inclinic-receipt-updated"));
}

export function removeReceipt(id: string): void {
  const existing = loadReceipts();
  const updated = existing.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("inclinic-receipt-updated"));
}

export function updateReceiptStatus(
  id: string,
  status: ReceiptStatus,
  rejectionReason?: string | null
): void {
  const existing = loadReceipts();
  const updated = existing.map((r) =>
    r.id === id ? { ...r, status, rejectionReason: rejectionReason ?? null } : r
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("inclinic-receipt-updated"));
}
