"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { loadReceipts, updateReceiptStatus, type ClientReceipt, type ReceiptStatus } from "@/lib/clientReceipt";
import { isSlotConflictRejection } from "@/lib/booking-rejection";
import { useLanguage } from "@/lib/i18n";
import { IconCheck, IconCalendar, IconDoctor, IconStethoscope, IconPhone } from "@/components/ui/Icons";

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
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 theme-icon-box"
      >
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
  if (status === "PENDING") return t.statusPending;
  return t.statusAccepted;
}

function ReceiptCard({ receipt }: { receipt: ClientReceipt }) {
  const { t } = useLanguage();
  const priceText =
    receipt.price != null
      ? `${receipt.price.toLocaleString()} ${t.somoni}`
      : "—";
  const status = receipt.status ?? "ACCEPTED";
  const statusClass =
    status === "PENDING" ? "text-amber-300" : status === "REJECTED" ? "text-red-400" : "neon-blue";

  return (
    <div className="rounded-2xl overflow-hidden w-full theme-card">
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(90deg, var(--theme-surface-pill), transparent)" }}
      >
        <div>
          <div className="neon-subtitle neon-blue tracking-[0.2em] text-[10px]">
            InClinic
          </div>
          <div className="neon-title text-base neon-white mt-0.5">{t.receiptTitle}</div>
        </div>
        <div className={`text-[10px] px-2.5 py-1 rounded-full font-semibold theme-pill ${statusClass}`}>
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
          <div className="px-5 pb-3">
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(239,68,68,0.2)",
                border: "1px solid rgba(248,113,113,0.5)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
              }}
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold text-red-300 mb-1">
                {t.rejectionReason}
              </div>
              <div className="text-sm font-bold text-white leading-snug" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.65)" }}>
                {receipt.rejectionReason}
              </div>
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
        className="px-5 py-3 flex items-center justify-between text-[11px] theme-border-b"
        style={{ borderTop: "1px solid var(--theme-border-accent)", background: "var(--theme-surface-hover)" }}
      >
        <span className="text-theme-faint">{t.receiptId}</span>
        <span className="font-mono neon-blue text-xs">{receipt.id}</span>
      </div>
    </div>
  );
}

interface Props {
  variant?: "home";
}

export default function ClientReceiptPanel({ variant }: Props) {
  const { t } = useLanguage();
  const [receipts, setReceipts] = useState<ClientReceipt[]>([]);
  const [expanded, setExpanded] = useState(false);

  function refresh() {
    setReceipts(loadReceipts());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("inclinic-receipt-updated", refresh);
    const interval = setInterval(refresh, 60_000);

    async function pollPending() {
      const list = loadReceipts().filter((r) => r.status === "PENDING");
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
      clearInterval(interval);
      clearInterval(pollInterval);
    };
  }, []);

  if (receipts.length === 0) return null;

  const countLabel =
    receipts.length === 1
      ? `1 ${t.receiptCount}`
      : `${receipts.length} ${t.receiptCountMany}`;

  if (variant === "home") {
    return (
      <div className="w-full text-center">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full max-w-md mx-auto mb-4 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] theme-pill"
          style={{
            boxShadow: expanded ? "0 0 24px rgba(14,165,233,0.25)" : "0 0 12px rgba(14,165,233,0.1)",
          }}
        >
          <span className={expanded ? "neon-blue" : "neon-white"}>
            {expanded ? t.receiptHide : t.receiptShow}
          </span>
          <span className="block text-[10px] mt-1 text-theme-muted font-normal">
            {countLabel} · {t.receiptSubtitle}
          </span>
        </button>

        {expanded && (
          <div className="space-y-4 max-w-md mx-auto">
            {receipts.map((r) => (
              <ReceiptCard key={r.id} receipt={r} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
