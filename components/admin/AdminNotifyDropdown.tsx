"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { INotifications } from "./icons";
import type { Appointment } from "@/lib/admin/types";

export default function AdminNotifyDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings?status=PENDING&pageSize=8", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { bookings?: Appointment[] };
      setItems(data.bookings ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const count = items.length;

  return (
    <div className="oa-notify-wrap" ref={ref}>
      <button
        type="button"
        className="oa-notify-btn"
        aria-label="Уведомления"
        aria-expanded={open}
        onClick={() => { setOpen((v) => !v); if (!open) load(); }}
      >
        <INotifications style={{ width: 18, height: 18 }} />
        {count > 0 && <span className="oa-notify-badge oa-notify-badge--count">{count > 9 ? "9+" : count}</span>}
      </button>

      {open && (
        <div className="oa-notify-panel">
          <div className="oa-notify-panel-head">
            <span>Новые заявки</span>
            {loading && <span className="oa-notify-panel-muted">…</span>}
          </div>

          {items.length === 0 ? (
            <div className="oa-notify-empty">Нет ожидающих заявок</div>
          ) : (
            <ul className="oa-notify-list">
              {items.map((b) => (
                <li key={b.id}>
                  <Link
                    href="/admin/appointments"
                    className="oa-notify-item"
                    onClick={() => setOpen(false)}
                  >
                    <div className="oa-notify-item-title">{b.patientName}</div>
                    <div className="oa-notify-item-sub">
                      {b.serviceName} · {b.doctorName}
                    </div>
                    <div className="oa-notify-item-meta">
                      {b.date.slice(8, 10)}.{b.date.slice(5, 7)} · {b.time}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="oa-notify-panel-foot">
            <Link href="/admin/notifications" className="oa-notify-foot-link" onClick={() => setOpen(false)}>
              Все уведомления
            </Link>
            <Link href="/admin/appointments" className="oa-notify-foot-link" onClick={() => setOpen(false)}>
              Записи
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
