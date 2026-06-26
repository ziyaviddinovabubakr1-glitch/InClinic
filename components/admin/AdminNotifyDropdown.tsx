"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useNotifications, useMarkNotificationRead } from "@/lib/admin/query/hooks";
import { INotifications } from "./icons";
import type { AdminNotification } from "@/lib/admin/services/notifications";

export default function AdminNotifyDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: items = [], isLoading, isFetching } = useNotifications();
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unread = items.filter((n) => !n.read);
  const count = unread.length;
  const preview = items.slice(0, 8);

  async function openItem(n: AdminNotification) {
    if (!n.read) {
      await markRead.mutateAsync(n.id);
    }
    setOpen(false);
  }

  return (
    <div className="oa-notify-wrap" ref={ref}>
      <button
        type="button"
        className="oa-notify-btn"
        aria-label="Уведомления"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <INotifications style={{ width: 18, height: 18 }} />
        {count > 0 && (
          <span className="oa-notify-badge oa-notify-badge--count">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="oa-notify-panel">
          <div className="oa-notify-panel-head">
            <span>Уведомления</span>
            {(isLoading || isFetching) && <span className="oa-notify-panel-muted">…</span>}
          </div>

          {preview.length === 0 ? (
            <div className="oa-notify-empty">Нет новых уведомлений</div>
          ) : (
            <ul className="oa-notify-list">
              {preview.map((n) => (
                <li key={n.id}>
                  <Link
                    href="/admin/notifications"
                    className="oa-notify-item"
                    style={{ opacity: n.read ? 0.72 : 1 }}
                    onClick={() => openItem(n)}
                  >
                    <div className="oa-notify-item-title">{n.title}</div>
                    <div className="oa-notify-item-sub">{n.message}</div>
                    <div className="oa-notify-item-meta">{n.time}</div>
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
