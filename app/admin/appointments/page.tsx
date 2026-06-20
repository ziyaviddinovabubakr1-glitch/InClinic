"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listAppointments, updateAppointmentStatus, allowedTransitions, money,
} from "@/lib/admin/services";
import type { Appointment, AppointmentStatus } from "@/lib/admin/types";
import { Avatar, StatusBadge, SkeletonRows, EmptyState, Pagination } from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import { ISearch, IAppointments, ICheck, IClose, IShield } from "@/components/admin/icons";

const STATUSES: (AppointmentStatus | "ALL")[] = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const STATUS_LABEL: Record<string, string> = {
  ALL: "Все", PENDING: "Ожидают", CONFIRMED: "Подтверждённые", COMPLETED: "Завершённые", CANCELLED: "Отменённые",
};
const TRANSITION_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Ожидает", CONFIRMED: "Подтвердить", COMPLETED: "Завершить", CANCELLED: "Отменить",
};

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
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="oa-toolbar">
        <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
          <ISearch />
          <input className="oa-input" placeholder="Поиск по пациенту, врачу или услуге" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="oa-chips">
          {STATUSES.map((s) => (
            <button key={s} className={`oa-chip ${status === s ? "oa-chip-active" : ""}`} onClick={() => setStatus(s)}>{STATUS_LABEL[s]}</button>
          ))}
        </div>
      </div>

      <div className="oa-card oa-callout">
        <IShield style={{ width: 18, height: 18, color: "var(--oa-accent-2)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "var(--oa-text-soft)" }}>
          Завершённые приёмы сохраняются навсегда и не могут быть удалены — данные доступны для аналитики и архива.
        </span>
      </div>

      <div className="oa-card oa-table-card">
        {!rows ? (
          <div className="oa-card-pad"><SkeletonRows rows={8} /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<IAppointments />} title="Записи не найдены" sub="Измените фильтры поиска." />
        ) : (
          <div className="oa-table-wrap">
            <table className="oa-table">
              <thead>
                <tr>
                  <th>Пациент</th><th>Врач</th><th>Услуга</th>
                  <th>Дата / время</th><th>Сумма</th><th>Статус</th><th style={{ textAlign: "right" }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const next = allowedTransitions(a.status);
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <Avatar name={a.patientName} size={32} tone="violet" />
                          <span className="oa-cell-strong">{a.patientName}</span>
                        </div>
                      </td>
                      <td className="oa-cell-soft">{a.doctorName}</td>
                      <td className="oa-cell-soft">{a.serviceName}</td>
                      <td className="oa-cell-soft">{a.date}<br /><span style={{ fontSize: 12 }}>{a.time}</span></td>
                      <td className="oa-cell-strong">{money(a.price)}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {next.length === 0 ? (
                            <span style={{ fontSize: 11.5, color: "var(--oa-text-faint)" }}>{a.status === "COMPLETED" ? "в архиве" : "—"}</span>
                          ) : next.map((n) => (
                            <button key={n}
                              className={`oa-btn oa-btn-sm ${n === "CANCELLED" ? "oa-btn-danger" : n === "COMPLETED" ? "oa-btn-success" : "oa-btn-soft"}`}
                              onClick={() => transition(a, n)}>
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
          </div>
        )}
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />
    </MotionPage>
  );
}
