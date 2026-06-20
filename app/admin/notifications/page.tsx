"use client";

import { useEffect, useState } from "react";
import { getNotifications, markAllNotificationsRead } from "@/lib/admin/services";
import type { AdminNotification } from "@/lib/admin/services/notifications";
import { SectionHeader, SkeletonRows, EmptyState } from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import { INotifications, IPatients, IAppointments, IReviews, IArchive, IDoctors, ICalendar } from "@/components/admin/icons";

const TYPE_ICON: Record<AdminNotification["type"], (p: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  patient: IPatients,
  appointment: IAppointments,
  review: IReviews,
  cancel: IArchive,
  doctor: IDoctors,
  schedule: ICalendar,
};

const TYPE_TONE: Record<AdminNotification["type"], string> = {
  patient: "blue",
  appointment: "sky",
  review: "amber",
  cancel: "red",
  doctor: "violet",
  schedule: "green",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<AdminNotification[] | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    getNotifications().then(setItems);
  }, []);

  const visible = items?.filter((n) => filter === "all" || !n.read) ?? [];
  const unread = items?.filter((n) => !n.read).length ?? 0;

  async function markAll() {
    await markAllNotificationsRead();
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760, margin: "0 auto", width: "100%" }}>
      <div className="oa-card oa-card-pad">
        <SectionHeader
          title="Уведомления"
          sub="События клиники: пациенты, записи, отзывы и расписание"
          action={
            unread > 0 ? (
              <button type="button" className="oa-btn oa-btn-ghost oa-btn-sm" onClick={markAll}>
                Прочитать все ({unread})
              </button>
            ) : (
              <span className="oa-badge oa-badge-neutral">Все прочитаны</span>
            )
          }
        />

        <div className="oa-chips" style={{ marginBottom: 16 }}>
          <button type="button" className={`oa-chip ${filter === "all" ? "oa-chip-active" : ""}`} onClick={() => setFilter("all")}>
            Все
          </button>
          <button type="button" className={`oa-chip ${filter === "unread" ? "oa-chip-active" : ""}`} onClick={() => setFilter("unread")}>
            Непрочитанные {unread > 0 ? `(${unread})` : ""}
          </button>
        </div>

        {!items ? (
          <SkeletonRows rows={6} />
        ) : visible.length === 0 ? (
          <EmptyState icon={<INotifications style={{ width: 28, height: 28 }} />} title="Нет уведомлений" sub="Новые события появятся здесь автоматически" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map((n) => {
              const Icon = TYPE_ICON[n.type];
              const tone = TYPE_TONE[n.type];
              return (
                <div
                  key={n.id}
                  className="oa-card"
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    opacity: n.read ? 0.72 : 1,
                    borderColor: n.read ? undefined : "rgba(212,175,55,0.22)",
                  }}
                >
                  <div className={`oa-kpi-icon oa-tone-${tone}`} style={{ margin: 0, width: 40, height: 40, flexShrink: 0 }}>
                    <Icon style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
                      <span style={{ fontSize: 12, color: "var(--oa-text-faint)", whiteSpace: "nowrap" }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--oa-text-soft)", marginTop: 4 }}>{n.message}</div>
                  </div>
                  {!n.read && <span className="oa-badge-dot" style={{ marginTop: 6, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MotionPage>
  );
}
