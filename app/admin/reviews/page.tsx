"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useReviewsList,
  useReviewAnalytics,
  useDoctorsList,
  useApproveReview,
  useRejectReview,
  useDeleteReview,
} from "@/lib/admin/query/hooks";
import { useAdminPermissions } from "@/components/providers/AdminPermissionsProvider";
import type { Review, ReviewStatus } from "@/lib/admin/types";
import { ConfirmDialog } from "@/components/admin/Modal";
import {
  Avatar, Stars, ReviewStatusBadge, StatTile, SkeletonCard, EmptyState, Pagination,
  formatShortName,
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
const RATING_OPTIONS = RATINGS.map((r) => ({
  id: r === "ALL" ? "ALL" : String(r),
  label: r === "ALL" ? "Все ★" : `${r}★`,
}));

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<ReviewStatus | "ALL">("ALL");
  const [rating, setRating] = useState<number | "ALL">("ALL");
  const [doctorId, setDoctorId] = useState("");
  const [toDelete, setToDelete] = useState<Review | null>(null);
  const pageSize = 20;
  const { can } = useAdminPermissions();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 180);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debounced, status, rating, doctorId]);

  function runSearch(next?: string) {
    setDebounced((next ?? search).trim());
  }

  const { data: doctors = [] } = useDoctorsList();
  const { data: analytics } = useReviewAnalytics();
  const { data, isLoading } = useReviewsList({
    search: debounced,
    status,
    rating,
    doctorId: doctorId || undefined,
    page,
    pageSize,
  });
  const approve = useApproveReview();
  const reject = useRejectReview();
  const remove = useDeleteReview();

  const rows = data?.rows ?? null;
  const total = data?.total ?? 0;

  async function moderate(r: Review, next: ReviewStatus) {
    if (next === "APPROVED") await approve.mutateAsync(r.id);
    else if (next === "REJECTED") await reject.mutateAsync(r.id);
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canModerate = can("review:update");

  const doctorOptions = [
    { id: "", label: "Все врачи" },
    ...doctors.map((d) => ({ id: d.id, label: formatShortName(d.fullName) })),
  ];

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
        loading={isLoading && !rows}
        noHorizontalScroll
        empty={
          rows?.length === 0
            ? { icon: <IReviews />, title: "Отзывы не найдены", sub: "Измените фильтры поиска." }
            : undefined
        }
        toolbar={
          <div className="oa-reviews-toolbar">
            <form
              className="oa-search oa-search-gold oa-reviews-search"
              onSubmit={(e) => { e.preventDefault(); runSearch(); }}
            >
              <ISearch />
              <input
                className="oa-input"
                type="search"
                placeholder="Поиск по пациенту, врачу или тексту"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Поиск отзывов"
              />
              <button type="submit" className="oa-search-submit" aria-label="Найти">
                <ISearch style={{ width: 16, height: 16 }} />
              </button>
            </form>
            <SegmentedControl
              options={STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s] }))}
              value={status}
              onChange={setStatus}
              className="oa-reviews-status-tabs"
            />
            <SegmentedControl
              options={doctorOptions}
              value={doctorId}
              onChange={setDoctorId}
              className="oa-reviews-doctor-tabs"
            />
            <SegmentedControl
              options={RATING_OPTIONS}
              value={rating === "ALL" ? "ALL" : String(rating)}
              onChange={(id) => setRating(id === "ALL" ? "ALL" : Number(id))}
              className="oa-reviews-rating-tabs"
            />
          </div>
        }
        footer={
          <>
            <span>{total} отзывов</span>
            <Pagination page={page} pages={pages} onChange={setPage} />
          </>
        }
      >
        <table className="oa-table oa-table-reviews">
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
                <td className="oa-mob-card-head" data-label="Пациент">
                  <div className="oa-review-patient">
                    <Avatar name={r.patientName} size={22} tone="violet" />
                    <Link href={`/admin/patients/${r.patientId}`} className="oa-cell-link oa-review-patient-name" title={r.patientName}>
                      {formatShortName(r.patientName)}
                    </Link>
                  </div>
                </td>
                <td className="oa-review-doctor" data-label="Врач" title={r.doctorName}>
                  {formatShortName(r.doctorName)}
                </td>
                <td data-label="Рейтинг">
                  <div className="oa-review-rating">
                    <Stars rating={r.rating} size={11} />
                    <span>{r.rating}</span>
                  </div>
                </td>
                <td className="oa-review-comment" data-label="Комментарий" title={r.comment || undefined}>
                  {r.comment || "—"}
                </td>
                <td data-label="Статус"><ReviewStatusBadge status={r.status} /></td>
                <td className="oa-review-date" data-label="Дата">{formatReviewDate(r.date)}</td>
                <td data-label="Действия">
                  <div className="oa-review-actions">
                    {canModerate && r.status !== "APPROVED" && (
                      <button
                        type="button"
                        className="oa-review-btn oa-review-btn--approve oa-review-btn--icon"
                        disabled={approve.isPending}
                        onClick={() => moderate(r, "APPROVED")}
                        aria-label="Одобрить"
                        title="Одобрить"
                      >
                        <ICheck style={{ width: 13, height: 13 }} />
                      </button>
                    )}
                    {canModerate && r.status !== "REJECTED" && (
                      <button
                        type="button"
                        className="oa-review-btn oa-review-btn--reject oa-review-btn--icon"
                        disabled={reject.isPending}
                        onClick={() => moderate(r, "REJECTED")}
                        aria-label="Отклонить"
                        title="Отклонить"
                      >
                        <IClose style={{ width: 13, height: 13 }} />
                      </button>
                    )}
                    {can("review:delete") && (
                      <button
                        type="button"
                        className="oa-review-btn oa-review-btn--delete"
                        onClick={() => setToDelete(r)}
                        aria-label="Удалить"
                      >
                        <ITrash style={{ width: 12, height: 12 }} />
                      </button>
                    )}
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
          if (toDelete) remove.mutate(toDelete.id);
          setToDelete(null);
        }}
      />
    </MotionPage>
  );
}
