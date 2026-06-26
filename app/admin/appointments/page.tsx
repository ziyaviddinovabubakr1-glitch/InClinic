"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useAppointmentsList,
  useUpdateAppointmentStatus,
} from "@/lib/admin/query/hooks";
import { allowedTransitions, money } from "@/lib/admin/services";
import type { Appointment, AppointmentStatus } from "@/lib/admin/types";
import { Avatar, StatusBadge, EmptyState, Pagination } from "@/components/admin/ui";
import { DataTableShell } from "@/components/admin/DataTable";
import { MotionPage } from "@/components/admin/motion";
import PageHeader from "@/components/admin/PageHeader";
import SegmentedControl from "@/components/admin/SegmentedControl";
import { ISearch, IAppointments, ICheck, IClose } from "@/components/admin/icons";

const STATUSES: (AppointmentStatus | "ALL")[] = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const STATUS_LABEL: Record<string, string> = {
  ALL: "Все", PENDING: "Ожидают", CONFIRMED: "Подтверждённые", COMPLETED: "Завершённые", CANCELLED: "Отменённые",
};
const TRANSITION_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Ожидает", CONFIRMED: "Подтвердить", COMPLETED: "Завершить", CANCELLED: "Отменить",
};

function formatApptDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
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
          <table className="oa-table">
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
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={a.patientName} size={28} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.patientName}</div>
                          {a.patientPhone && (
                            <div style={{ fontSize: 12, color: "var(--oa-text-faint)" }}>{a.patientPhone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{a.serviceName}</td>
                    <td>{a.doctorName}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatApptDate(a.date)} · {a.time}</td>
                    <td>{money(a.price ?? 0)}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {transitions.map((next) => (
                          <button
                            key={next}
                            type="button"
                            className={`oa-btn oa-btn-sm ${next === "CANCELLED" ? "oa-btn-ghost" : "oa-btn-primary"}`}
                            disabled={updateStatus.isPending}
                            onClick={() => transition(a, next)}
                            title={TRANSITION_LABEL[next]}
                          >
                            {next === "CONFIRMED" ? <ICheck style={{ width: 14, height: 14 }} /> : next === "CANCELLED" ? <IClose style={{ width: 14, height: 14 }} /> : TRANSITION_LABEL[next]}
                          </button>
                        ))}
                        {a.patientId && (
                          <Link href={`/admin/patients/${a.patientId}`} className="oa-btn oa-btn-ghost oa-btn-sm" style={{ textDecoration: "none" }}>
                            Профиль
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
