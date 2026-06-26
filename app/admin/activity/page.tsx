"use client";

import { useEffect, useState } from "react";
import { useActivityLog } from "@/lib/admin/query/hooks";
import { EmptyState, Pagination, SkeletonRows } from "@/components/admin/ui";
import { DataTableShell } from "@/components/admin/DataTable";
import { MotionPage } from "@/components/admin/motion";
import PageHeader from "@/components/admin/PageHeader";
import { ISearch, IActivity } from "@/components/admin/icons";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const pageSize = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debounced]);

  const { data, isLoading } = useActivityLog({ page, pageSize, search: debounced || undefined });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="Журнал активности"
        sub="Аудит действий администраторов и системных событий"
      />

      <DataTableShell
        loading={isLoading && !data}
        empty={
          !isLoading && rows.length === 0
            ? { icon: <IActivity />, title: "Записей нет", sub: "Измените поиск или дождитесь новых событий." }
            : undefined
        }
        toolbar={
          <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
            <ISearch />
            <input
              className="oa-input"
              placeholder="Поиск по действию, сущности, ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
        footer={
          pages > 1 ? (
            <Pagination page={page} pages={pages} onChange={setPage} />
          ) : undefined
        }
      >
        {isLoading && !data ? (
          <SkeletonRows rows={8} />
        ) : (
          <table className="oa-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Пользователь</th>
                <th>Действие</th>
                <th>Сущность</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: 13, color: "var(--oa-text-soft)" }}>
                    {formatWhen(r.createdAt)}
                  </td>
                  <td>{r.username ?? "—"}</td>
                  <td>{r.summary}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--oa-text-faint)" }}>
                    {r.entity}{r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataTableShell>
    </MotionPage>
  );
}
