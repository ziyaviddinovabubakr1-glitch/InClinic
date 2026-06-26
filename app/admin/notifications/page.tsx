"use client";

import { useState } from "react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/admin/query/hooks";
import type { AdminNotification } from "@/lib/admin/services/notifications";
import { SectionHeader, SkeletonRows, EmptyState } from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import SegmentedControl from "@/components/admin/SegmentedControl";
import {
  INotifications, IPatients, IAppointments, IReviews, IArchive, IDoctors, ICalendar,
} from "@/components/admin/icons";

const TYPE_ICON: Record<string, (p: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  patient: IPatients,
  booking: IAppointments,
  appointment: IAppointments,
  review: IReviews,
  cancel: IArchive,
  doctor: IDoctors,
  schedule: ICalendar,
  system: INotifications,
};

const TYPE_TONE: Record<string, string> = {
  patient: "blue",
  booking: "sky",
  appointment: "sky",
  review: "amber",
  cancel: "red",
  doctor: "violet",
  schedule: "green",
  system: "blue",
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data: items, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const list = items ?? [];
  const visible = list.filter((n) => filter === "all" || !n.read);
  const unread = list.filter((n) => !n.read).length;

  async function handleMarkAll() {
    await markAll.mutateAsync();
  }

  async function handleMarkOne(n: AdminNotification) {
    if (!n.read) await markRead.mutateAsync(n.id);
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760, margin: "0 auto", width: "100%" }}>
      <div className="oa-card oa-card-pad">
        <SectionHeader
          title="Уведомления"
          sub="События клиники: пациенты, записи, отзывы и расписание"
          action={
            unread > 0 ? (
              <button
                type="button"
                className="oa-btn oa-btn-ghost oa-btn-sm"
                onClick={handleMarkAll}
                disabled={markAll.isPending}
              >
                Прочитать все ({unread})
              </button>
            ) : (
              <span className="oa-badge oa-badge-neutral">Все прочитаны</span>
            )
          }
        />

        <SegmentedControl
          options={[
            { id: "all", label: "Все" },
            { id: "unread", label: unread > 0 ? `Непрочитанные (${unread})` : "Непрочитанные" },
          ]}
          value={filter}
          onChange={setFilter}
          className="oa-segmented-block"
        />

        {isLoading ? (
          <SkeletonRows rows={6} />
        ) : visible.length === 0 ? (
          <EmptyState icon={<INotifications style={{ width: 28, height: 28 }} />} title="Нет уведомлений" sub="Новые события появятся здесь автоматически" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? INotifications;
              const tone = TYPE_TONE[n.type] ?? "blue";
              return (
                <button
                  key={n.id}
                  type="button"
                  className="oa-card"
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    opacity: n.read ? 0.72 : 1,
                    borderColor: n.read ? undefined : "rgba(212,175,55,0.22)",
                    width: "100%",
                    textAlign: "left",
                    cursor: n.read ? "default" : "pointer",
                    background: "inherit",
                  }}
                  onClick={() => handleMarkOne(n)}
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
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MotionPage>
  );
}
