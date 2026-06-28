"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useAppointmentsList,
  useUpdateAppointmentStatus,
} from "@/lib/admin/query/hooks";
import { allowedTransitions, money } from "@/lib/admin/services";
import type { Appointment, AppointmentStatus } from "@/lib/admin/types";
import { Avatar, StatusBadge, EmptyState, Pagination, formatShortName } from "@/components/admin/ui";
import { DataTableShell } from "@/components/admin/DataTable";
import { MotionPage } from "@/components/admin/motion";
import PageHeader from "@/components/admin/PageHeader";
import SegmentedControl from "@/components/admin/SegmentedControl";
import { ISearch, IAppointments, ICheck, IClose, IUserCircle } from "@/components/admin/icons";

const STATUSES: (AppointmentStatus | "ALL")[] = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const STATUS_LABEL: Record<string, string> = {
  ALL: "Все", PENDING: "Ожидают", CONFIRMED: "Подтверждённые", COMPLETED: "Завершённые", CANCELLED: "Отменённые",
};
const TRANSITION_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Ожидает", CONFIRMED: "Подтвердить", COMPLETED: "Завершить", CANCELLED: "Отменить",
};

function formatApptDate(iso: string, time: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return `${iso} · ${time}`;
  return `${m[3]}.${m[2]}.${m[1].slice(2)} · ${time}`;
}

function TransitionIcon({ next }: { next: AppointmentStatus }) {
  if (next === "CANCELLED") return <IClose style={{ width: 14, height: 14 }} />;
  if (next === "COMPLETED") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }
  return <ICheck style={{ width: 14, height: 14 }} />;
}

export default function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const pageSize = 14;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 180);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debounced, status]);

  const { data, isLoading, isFetching } = useAppointmentsList({
    search: debounced,
    status,
    page,
    pageSize,
  });
  const updateStatus = useUpdateAppointmentStatus();

  const rows = data?.rows ?? null;
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  async function transition(a: Appointment, next: AppointmentStatus) {
    await updateStatus.mutateAsync({ id: a.id, status: next });
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="Записи"
        sub="Управление статусами приёмов и расписанием"
        action={
          <SegmentedControl
            options={STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s] }))}
            value={status}
            onChange={setStatus}
          />
        }
      />

      <DataTableShell
        noHorizontalScroll
        loading={isLoading && !rows}
        empty={rows?.length === 0 ? { icon: <IAppointments />, title: "Записи не найдены", sub: "Измените фильтры поиска." } : undefined}
        toolbar={
          <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
            <ISearch />
            <input
              className="oa-input"
              placeholder="Поиск по пациенту, телефону, услуге…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {isFetching && rows && (
              <span style={{ fontSize: 11, color: "var(--oa-text-faint)", marginLeft: 8 }}>…</span>
            )}
          </div>
        }
        footer={pages > 1 ? <Pagination page={page} pages={pages} onChange={setPage} /> : undefined}
      >
        {rows && (
          <table className="oa-table oa-table-compact oa-table-bookings">
            <colgroup>
              <col className="oa-col-bk-patient" />
              <col className="oa-col-bk-service" />
              <col className="oa-col-bk-doctor" />
              <col className="oa-col-bk-date" />
              <col className="oa-col-bk-sum" />
              <col className="oa-col-bk-status" />
              <col className="oa-col-bk-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Пациент</th>
                <th>Услуга</th>
                <th>Врач</th>
                <th>Дата</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const transitions = allowedTransitions(a.status);
                return (
                  <tr key={a.id}>
                    <td className="oa-mob-card-head" data-label="Пациент">
                      <div className="oa-doctor-cell" title={`${a.patientName}${a.patientPhone ? ` · ${a.patientPhone}` : ""}`}>
                        <Avatar name={a.patientName} size={26} />
                        <div className="oa-doctor-cell-text">
                          <div className="oa-doctor-cell-name">{formatShortName(a.patientName)}</div>
                          {a.patientPhone && (
                            <div className="oa-doctor-cell-meta">{a.patientPhone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="oa-booking-service" data-label="Услуга" title={a.serviceName}>
                      {a.serviceName}
                    </td>
                    <td className="oa-booking-doctor" data-label="Врач" title={a.doctorName}>
                      {formatShortName(a.doctorName)}
                    </td>
                    <td className="oa-booking-date" data-label="Дата">
                      {formatApptDate(a.date, a.time)}
                    </td>
                    <td className="oa-booking-sum" data-label="Сумма">{money(a.price ?? 0)}</td>
                    <td data-label="Статус"><StatusBadge status={a.status} /></td>
                    <td data-label="Действия">
                      <div className="oa-table-actions oa-booking-actions">
                        {transitions.map((next) => (
                          <button
                            key={next}
                            type="button"
                            className={`oa-btn oa-btn-sm ${next === "CANCELLED" ? "oa-btn-ghost oa-btn-icon" : "oa-btn-primary oa-btn-icon"}`}
                            disabled={updateStatus.isPending}
                            onClick={() => transition(a, next)}
                            title={TRANSITION_LABEL[next]}
                            aria-label={TRANSITION_LABEL[next]}
                          >
                            <TransitionIcon next={next} />
                          </button>
                        ))}
                        {a.patientId && (
                          <Link
                            href={`/admin/patients/${a.patientId}`}
                            className="oa-btn oa-btn-ghost oa-btn-sm oa-btn-icon"
                            title="Профиль пациента"
                            aria-label="Профиль пациента"
                          >
                            <IUserCircle style={{ width: 14, height: 14 }} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </DataTableShell>
    </MotionPage>
  );
}
