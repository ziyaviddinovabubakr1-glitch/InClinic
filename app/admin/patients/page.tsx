"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  listPatients, getSegmentCounts, createPatient, money,
} from "@/lib/admin/services";
import type { Patient, PatientSegment } from "@/lib/admin/types";
import {
  Avatar, SegmentBadge, SkeletonRows, Pagination, EmptyState,
} from "@/components/admin/ui";
import { DataTableShell } from "@/components/admin/DataTable";
import { MotionPage } from "@/components/admin/motion";
import PageHeader from "@/components/admin/PageHeader";
import PatientFormModal from "@/components/admin/PatientFormModal";
import { ISearch, IPatients, IPlus, IChevronRight } from "@/components/admin/icons";

const SEGMENTS: (PatientSegment | "ALL")[] = ["ALL", "NEW", "REGULAR", "VIP", "INACTIVE"];
const SEG_LABEL: Record<string, string> = {
  ALL: "Все", NEW: "Новые", REGULAR: "Постоянные", VIP: "VIP", INACTIVE: "Неактивные",
};

type SortKey = "createdAt" | "name" | "totalPaid";

export default function PatientsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Patient[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<PatientSegment | "ALL">("ALL");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [counts, setCounts] = useState<Record<PatientSegment, number> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 12;

  const refresh = useCallback(() => {
    setRows(null);
    setError("");
    listPatients({ search, segment, page, pageSize, sort })
      .then((r) => {
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"));
  }, [search, segment, page, sort]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  useEffect(() => { getSegmentCounts().then(setCounts).catch(() => {}); }, [rows]);
  useEffect(() => { setPage(1); }, [search, segment, sort]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const totalPatients = counts
    ? counts.NEW + counts.REGULAR + counts.VIP + counts.INACTIVE
    : total;

  return (
    <MotionPage className="oa-patients-page">
      <PageHeader
        title="Пациенты"
        sub="База пациентов клиники · PostgreSQL"
        action={
          <button type="button" className="oa-btn oa-btn-primary oa-btn-sm" onClick={() => setCreateOpen(true)}>
            <IPlus style={{ width: 14, height: 14 }} /> Добавить
          </button>
        }
      />

      {error && <div className="oa-alert oa-alert-error">{error}</div>}

      <div className="oa-segment-stats">
        {SEGMENTS.map((s) => {
          const count = s === "ALL" ? totalPatients : counts?.[s as PatientSegment] ?? 0;
          return (
            <button
              key={s}
              type="button"
              className={`oa-segment-stat ${segment === s ? "oa-segment-stat-active" : ""}`}
              onClick={() => setSegment(s)}
            >
              <div className="oa-segment-stat-value">{count}</div>
              <div className="oa-segment-stat-label">{SEG_LABEL[s]}</div>
            </button>
          );
        })}
      </div>

      <DataTableShell
        loading={!rows}
        empty={
          rows?.length === 0
            ? { icon: <IPatients />, title: "Пациенты не найдены", sub: "Создайте пациента или измените фильтры." }
            : undefined
        }
        toolbar={
          <div className="oa-table-toolbar-inner">
            <div className="oa-search" style={{ flex: 1, minWidth: 200 }}>
              <ISearch />
              <input
                className="oa-input"
                placeholder="Поиск по имени, телефону, email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="oa-select oa-select-compact"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Сортировка"
            >
              <option value="createdAt">Новые первые</option>
              <option value="name">По имени</option>
              <option value="totalPaid">По сумме</option>
            </select>
          </div>
        }
        footer={<Pagination page={page} pages={pages} onChange={setPage} />}
      >
        <table className="oa-table oa-table-dense">
          <thead>
            <tr>
              <th>Пациент</th>
              <th>Контакты</th>
              <th>Сегмент</th>
              <th>Визиты</th>
              <th>Сумма</th>
              <th>Последний визит</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows?.map((p) => (
              <tr key={p.id} className="oa-table-row-clickable">
                <td>
                  <Link href={`/admin/patients/${p.id}`} className="oa-cell-user oa-cell-link">
                    <Avatar name={p.fullName} size={28} tone="violet" />
                    <div>
                      <div className="oa-cell-strong">{p.fullName}</div>
                      {p.age != null && (
                        <div className="oa-cell-soft">{p.age} лет</div>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="oa-cell-soft">
                  <div>{p.phone}</div>
                  {p.email && <div className="oa-cell-soft">{p.email}</div>}
                </td>
                <td><SegmentBadge segment={p.segment} /></td>
                <td className="oa-cell-strong">{p.visitsCount}</td>
                <td className="oa-cell-strong">{money(p.totalPaid)}</td>
                <td className="oa-cell-soft">
                  {p.lastVisitAt
                    ? new Date(p.lastVisitAt).toLocaleDateString("ru-RU")
                    : "—"}
                </td>
                <td>
                  <Link href={`/admin/patients/${p.id}`} className="oa-link-sm">
                    Профиль <IChevronRight style={{ width: 11, height: 11 }} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>

      <PatientFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Новый пациент"
        onSave={async (data) => {
          const patient = await createPatient(data);
          refresh();
          router.push(`/admin/patients/${patient.id}`);
        }}
      />
    </MotionPage>
  );
}
