"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import {
  loadAllReceipts,
  loadReceipts,
  updateReceiptStatus,
  isUpcomingReceipt,
  isCompletedReceipt,
  isRejectedReceipt,
  type ClientReceipt,
  type ReceiptStatus,
} from "@/lib/clientReceipt";
import { isSlotConflictRejection } from "@/lib/booking-rejection";
import { useLanguage } from "@/lib/i18n";
import { IconCheck, IconCalendar, IconDoctor, IconStethoscope, IconPhone, IconClipboard } from "@/components/ui/Icons";

type Tab = "upcoming" | "completed" | "all";

function CheckRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b theme-border-b last:border-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 theme-icon-box">
        <IconCheck size={14} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-[10px] uppercase tracking-wider text-theme-faint mb-0.5">{label}</div>
        <div className={`text-sm font-semibold leading-snug ${accent ? "neon-blue" : "neon-white"}`}>
          {value}
        </div>
      </div>
      <div className="flex-shrink-0 opacity-60">{icon}</div>
    </div>
  );
}

function statusLabel(status: ReceiptStatus | undefined, t: ReturnType<typeof useLanguage>["t"]) {
  if (status === "ACCEPTED") return t.statusAccepted;
  if (status === "REJECTED") return t.statusRejected;
  if (status === "COMPLETED") return t.statusCompleted;
  if (status === "PENDING") return t.statusPending;
  return t.statusAccepted;
}

function receiptStatusClass(status: ReceiptStatus | undefined): string {
  if (status === "PENDING") return "text-amber-300";
  if (status === "REJECTED") return "text-red-400";
  if (status === "COMPLETED") return "text-emerald-300";
  return "neon-blue";
}

export function ReceiptCard({ receipt }: { receipt: ClientReceipt }) {
  const { t } = useLanguage();
  const priceText =
    receipt.price != null ? `${receipt.price.toLocaleString()} ${t.somoni}` : "—";
  const status = receipt.status ?? "ACCEPTED";

  return (
    <div className="rounded-2xl overflow-hidden w-full theme-card">
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(90deg, var(--theme-surface-pill), transparent)" }}
      >
        <div>
          <div className="neon-subtitle neon-blue tracking-[0.2em] text-[10px]">InClinic</div>
          <div className="neon-title text-base neon-white mt-0.5">{t.receiptTitle}</div>
        </div>
        <div className={`text-[10px] px-2.5 py-1 rounded-full font-semibold theme-pill ${receiptStatusClass(status)}`}>
          {statusLabel(status, t)}
        </div>
      </div>

      <div className="px-5 py-2">
        <CheckRow label={t.patient} value={`${receipt.firstName} ${receipt.lastName}`} icon={<IconDoctor size={16} />} />
        <CheckRow label={t.phone} value={receipt.phone} icon={<IconPhone size={16} />} />
        <CheckRow
          label={t.doctor}
          value={receipt.doctorSpecialty ? `${receipt.doctor} · ${receipt.doctorSpecialty}` : receipt.doctor}
          icon={<IconDoctor size={16} />}
        />
        <CheckRow label={t.service} value={receipt.service} icon={<IconStethoscope size={16} />} />
        <CheckRow
          label={t.datetime}
          value={`${receipt.dateFormatted} · ${receipt.timeSlot}`}
          accent
          icon={<IconCalendar size={16} />}
        />
        <CheckRow label={t.price} value={priceText} icon={<IconStethoscope size={16} />} />
        <CheckRow
          label={t.payment}
          value={receipt.paid ? t.paid : t.unpaid}
          accent={!receipt.paid}
          icon={<IconCheck size={16} />}
        />
        {status === "REJECTED" && receipt.rejectionReason && (
          <div className="px-0 pb-3">
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(239,68,68,0.2)",
                border: "1px solid rgba(248,113,113,0.5)",
              }}
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold text-red-300 mb-1">
                {t.rejectionReason}
              </div>
              <div className="text-sm font-bold text-white leading-snug">{receipt.rejectionReason}</div>
            </div>
            {isSlotConflictRejection(receipt.rejectionReason) && (
              <Link href="/booking" className="btn-primary w-full mt-3 text-center text-sm !py-2.5 block">
                {t.pickNewSlot}
              </Link>
            )}
          </div>
        )}
      </div>

      <div
        className="px-5 py-3 flex items-center justify-between text-[11px]"
        style={{ borderTop: "1px solid var(--theme-border-accent)", background: "var(--theme-surface-hover)" }}
      >
        <span className="text-theme-faint">{t.receiptId}</span>
        <span className="font-mono neon-blue text-xs">{receipt.id}</span>
      </div>
    </div>
  );
}

export default function PatientRecordsPage() {
  const { t } = useLanguage();
  const [receipts, setReceipts] = useState<ClientReceipt[]>([]);
  const [tab, setTab] = useState<Tab>("upcoming");

  function refresh() {
    setReceipts(loadAllReceipts());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("inclinic-receipt-updated", refresh);

    async function pollPending() {
      const list = loadAllReceipts().filter((r) => r.status === "PENDING");
      await Promise.all(
        list.map(async (r) => {
          try {
            const res = await fetch(`/api/bookings/status?id=${encodeURIComponent(r.id)}`);
            if (!res.ok) return;
            const data = (await res.json()) as { status?: ReceiptStatus; rejectionReason?: string | null };
            if (data.status && data.status !== "PENDING") {
              updateReceiptStatus(r.id, data.status, data.rejectionReason);
            }
          } catch {
            /* ignore */
          }
        })
      );
      refresh();
    }

    const pollInterval = setInterval(pollPending, 5000);
    pollPending();

    return () => {
      window.removeEventListener("inclinic-receipt-updated", refresh);
      clearInterval(pollInterval);
    };
  }, []);

  const filtered = receipts.filter((r) => {
    if (tab === "upcoming") return isUpcomingReceipt(r);
    if (tab === "completed") return isCompletedReceipt(r);
    return true;
  });

  const upcomingCount = receipts.filter(isUpcomingReceipt).length;
  const completedCount = receipts.filter(isCompletedReceipt).length;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "upcoming", label: t.myTabUpcoming, count: upcomingCount },
    { id: "completed", label: t.myTabCompleted, count: completedCount },
    { id: "all", label: t.myTabAll, count: receipts.length },
  ];

  return (
    <div className="page-pad site-page">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center theme-icon-box">
              <IconClipboard size={22} />
            </div>
            <div>
              <h1 className="neon-title text-2xl text-theme font-semibold">{t.myRecordsTitle}</h1>
              <p className="text-theme-muted text-sm mt-0.5">{t.myRecordsSub}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === id ? "theme-pill neon-blue font-semibold" : "text-theme-muted theme-pill opacity-80"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-1.5 text-[10px] opacity-75">({count})</span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center theme-icon-box">
              <IconClipboard size={28} />
            </div>
            <p className="text-theme-muted text-sm mb-6 leading-relaxed">
              {tab === "upcoming" ? t.myEmptyUpcoming : tab === "completed" ? t.myEmptyCompleted : t.myEmptyAll}
            </p>
            <Link href="/booking" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
              <IconCalendar size={18} />
              {t.bookCta}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <ReceiptCard key={r.id} receipt={r} />
            ))}
          </div>
        )}

        {receipts.some(isRejectedReceipt) && tab === "all" && (
          <p className="text-center text-theme-faint text-xs mt-6">{t.myRejectedHint}</p>
        )}
      </div>
    </div>
  );
}

/** Badge count for sidebar — upcoming receipts only. */
export function useUpcomingReceiptCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function update() {
      setCount(loadReceipts().length);
    }
    update();
    window.addEventListener("inclinic-receipt-updated", update);
    return () => window.removeEventListener("inclinic-receipt-updated", update);
  }, []);

  return count;
}
