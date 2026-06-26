"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listReviews,
  approveReview,
  rejectReview,
  deleteReview,
  getReviewAnalytics,
  listDoctors,
} from "@/lib/admin/services";
import type { Review, ReviewAnalytics, ReviewStatus } from "@/lib/admin/types";
import type { Doctor } from "@/lib/admin/types";
import { ConfirmDialog } from "@/components/admin/Modal";
import {
  Avatar, Stars, ReviewStatusBadge, StatTile, SkeletonCard, EmptyState, Pagination,
} from "@/components/admin/ui";
import { DataTableShell } from "@/components/admin/DataTable";
import { MotionPage } from "@/components/admin/motion";
import PageHeader from "@/components/admin/PageHeader";
import SegmentedControl from "@/components/admin/SegmentedControl";
import { ISearch, IReviews, ICheck, IClose, ITrash } from "@/components/admin/icons";

const STATUSES: (ReviewStatus | "ALL")[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];
const STATUS_LABEL: Record<string, string> = {
  ALL: "Все",
  PENDING: "На модерации",
  APPROVED: "Одобренные",
  REJECTED: "Отклонённые",
};
const RATINGS: (number | "ALL")[] = ["ALL", 5, 4, 3, 2, 1];

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function ReviewsPage() {
  const [rows, setRows] = useState<Review[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReviewStatus | "ALL">("ALL");
  const [rating, setRating] = useState<number | "ALL">("ALL");
  const [doctorId, setDoctorId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [toDelete, setToDelete] = useState<Review | null>(null);
  const pageSize = 12;

  useEffect(() => {
    listDoctors().then(setDoctors);
  }, []);

  const refresh = useCallback(() => {
    setRows(null);
    listReviews({
      search,
      status,
      rating,
      doctorId: doctorId || undefined,
      page,
      pageSize,
    }).then((r) => {
      setRows(r.rows);
      setTotal(r.total);
    });
    getReviewAnalytics().then(setAnalytics);
  }, [search, status, rating, doctorId, page]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);
  useEffect(() => { setPage(1); }, [search, status, rating, doctorId]);

  async function moderate(r: Review, next: ReviewStatus) {
    if (next === "APPROVED") await approveReview(r.id);
    else if (next === "REJECTED") await rejectReview(r.id);
    refresh();
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <MotionPage className="oa-reviews-page">
      <PageHeader
        title="Отзывы"
        sub="Модерация отзывов пациентов и рейтинг врачей"
      />

      {!analytics ? (
        <div className="oa-profile-stats">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} height={72} />
          ))}
        </div>
      ) : (
        <div className="oa-profile-stats">
          <StatTile label="Средний рейтинг" value={analytics.clinicRating.toFixed(1)} large />
          <StatTile label="Всего отзывов" value={String(analytics.totalReviews)} large />
          <StatTile label="На модерации" value={String(analytics.pendingCount)} large />
          <StatTile label="Одобрено" value={String(analytics.approvedCount)} large />
        </div>
      )}

      <DataTableShell
        loading={!rows}
        empty={
          rows?.length === 0
            ? { icon: <IReviews />, title: "Отзывы не найдены", sub: "Измените фильтры поиска." }
            : undefined
        }
        toolbar={
          <div className="oa-table-toolbar-inner">
            <div className="oa-search" style={{ flex: 1, minWidth: 200 }}>
              <ISearch />
              <input
                className="oa-input"
                placeholder="Поиск по пациенту, врачу или тексту"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <SegmentedControl
              options={STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s] }))}
              value={status}
              onChange={setStatus}
            />
            <select
              className="oa-select oa-select-compact"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Все врачи</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
            <div className="oa-chips">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`oa-chip ${rating === r ? "oa-chip-active" : ""}`}
                  onClick={() => setRating(r)}
                >
                  {r === "ALL" ? "Все ★" : `${r}★`}
                </button>
              ))}
            </div>
          </div>
        }
        footer={
          <>
            <span>{total} отзывов</span>
            <Pagination page={page} pages={pages} onChange={setPage} />
          </>
        }
      >
        <table className="oa-table">
          <thead>
            <tr>
              <th>Пациент</th>
              <th>Врач</th>
              <th>Рейтинг</th>
              <th>Комментарий</th>
              <th>Статус</th>
              <th>Дата</th>
              <th style={{ textAlign: "right" }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id}>
                <td data-label="Пациент">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={r.patientName} size={28} tone="violet" />
                    <Link href={`/admin/patients/${r.patientId}`} className="oa-cell-link oa-cell-strong">
                      {r.patientName}
                    </Link>
                  </div>
                </td>
                <td className="oa-cell-soft" data-label="Врач">{r.doctorName}</td>
                <td data-label="Рейтинг">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Stars rating={r.rating} size={12} />
                    <span className="oa-cell-strong">{r.rating}</span>
                  </div>
                </td>
                <td className="oa-cell-soft" data-label="Комментарий" style={{ maxWidth: 280 }}>
                  <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {r.comment || "—"}
                  </span>
                </td>
                <td data-label="Статус"><ReviewStatusBadge status={r.status} /></td>
                <td className="oa-cell-soft" data-label="Дата">{formatReviewDate(r.date)}</td>
                <td data-label="Действия">
                  <div className="oa-table-actions">
                    {r.status !== "APPROVED" && (
                      <button
                        type="button"
                        className="oa-btn oa-btn-success oa-btn-sm"
                        onClick={() => moderate(r, "APPROVED")}
                      >
                        <ICheck style={{ width: 13, height: 13 }} /> Одобрить
                      </button>
                    )}
                    {r.status !== "REJECTED" && (
                      <button
                        type="button"
                        className="oa-btn oa-btn-ghost oa-btn-sm"
                        onClick={() => moderate(r, "REJECTED")}
                      >
                        <IClose style={{ width: 13, height: 13 }} /> Отклонить
                      </button>
                    )}
                    <button
                      type="button"
                      className="oa-btn oa-btn-danger oa-btn-sm"
                      onClick={() => setToDelete(r)}
                    >
                      <ITrash style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Удалить отзыв?"
        message="Отзыв будет удалён без возможности восстановления."
        confirmLabel="Удалить"
        danger
        onConfirm={() => {
          if (toDelete) {
            deleteReview(toDelete.id).then(() => refresh());
          }
        }}
      />
    </MotionPage>
  );
}
