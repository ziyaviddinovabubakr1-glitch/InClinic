"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listAppointments, updateAppointmentStatus, allowedTransitions, money,
} from "@/lib/admin/services";
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
  const [rows, setRows] = useState<Appointment[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const pageSize = 14;

  const refresh = useCallback(() => {
    setRows(null);
    listAppointments({ search, status, page, pageSize }).then((r) => {
      setRows(r.rows);
      setTotal(r.total);
    });
  }, [search, status, page]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);
  useEffect(() => { setPage(1); }, [search, status]);

  async function transition(a: Appointment, next: AppointmentStatus) {
    await updateAppointmentStatus(a.id, next);
    refresh();
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

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
        loading={!rows}
        empty={rows?.length === 0 ? { icon: <IAppointments />, title: "Записи не найдены", sub: "Измените фильтры поиска." } : undefined}
        toolbar={
          <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
            <ISearch />
            <input
              className="oa-input"
              placeholder="Поиск по пациенту, врачу или услуге"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
        footer={
          <>
            <span>{total} записей</span>
            <Pagination page={page} pages={pages} onChange={setPage} />
          </>
        }
      >
        <table className="oa-table">
          <thead>
            <tr>
              <th className="oa-table-col-patient">Пациент</th>
              <th className="oa-table-col-doctor">Врач</th>
              <th className="oa-table-col-service">Услуга</th>
              <th className="oa-table-col-datetime">Дата / время</th>
              <th className="oa-table-col-sum">Сумма</th>
              <th className="oa-table-col-status">Статус</th>
              <th className="oa-table-col-actions" style={{ textAlign: "right" }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((a) => {
              const next = allowedTransitions(a.status);
              return (
                <tr key={a.id}>
                  <td className="oa-table-col-patient oa-table-col-patient-first" data-label="Пациент">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={a.patientName} size={28} tone="violet" />
                      <div>
                        {a.patientId ? (
                          <Link href={`/admin/patients/${a.patientId}`} className="oa-cell-link oa-cell-strong">
                            {a.patientName}
                          </Link>
                        ) : (
                          <span className="oa-cell-strong">{a.patientName}</span>
                        )}
                        <div className="oa-cell-soft" style={{ fontSize: 12 }}>{a.patientPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="oa-cell-soft oa-table-col-doctor" data-label="Врач">{a.doctorName}</td>
                  <td className="oa-cell-soft oa-table-col-service" data-label="Услуга">{a.serviceName}</td>
                  <td className="oa-table-col-datetime" data-label="Дата / время">
                    <div className="oa-datetime-cell">
                      <span className="oa-datetime-date">{formatApptDate(a.date)}</span>
                      <span className="oa-datetime-time">{a.time}</span>
                    </div>
                  </td>
                  <td className="oa-cell-strong oa-table-col-sum" data-label="Сумма">{money(a.price)}</td>
                  <td className="oa-table-col-status" data-label="Статус"><StatusBadge status={a.status} /></td>
                  <td className="oa-table-col-actions" data-label="Действия">
                    <div className="oa-table-actions">
                      {next.length === 0 ? (
                        <span style={{ fontSize: 12, color: "var(--oa-text-faint)" }}>
                          {a.status === "COMPLETED" ? "в архиве" : "—"}
                        </span>
                      ) : next.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`oa-btn oa-btn-sm ${n === "CANCELLED" ? "oa-btn-danger" : n === "COMPLETED" ? "oa-btn-success" : "oa-btn-soft"}`}
                          onClick={() => transition(a, n)}
                        >
                          {n === "CANCELLED" ? <IClose style={{ width: 13, height: 13 }} /> : <ICheck style={{ width: 13, height: 13 }} />}
                          {TRANSITION_LABEL[n]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTableShell>
    </MotionPage>
  );
}
