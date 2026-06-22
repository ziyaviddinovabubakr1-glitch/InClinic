"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listReviews, setReviewVisibility, replyToReview, deleteReview,
  getReviewAnalytics,
} from "@/lib/admin/services";
import type { Review, ReviewAnalytics, ReviewVisibility } from "@/lib/admin/types";
import { Modal, ConfirmDialog } from "@/components/admin/Modal";
import {
  Avatar, Stars, VisibilityBadge, SectionHeader, SkeletonRows, SkeletonCard, EmptyState,
  Pagination,
} from "@/components/admin/ui";
import { MotionPage, MotionGrid, MotionItem } from "@/components/admin/motion";
import {
  ISearch, IReviews, IEye, IEyeOff, ITrash, IReply, ICheck,
} from "@/components/admin/icons";

const VIS: (ReviewVisibility | "ALL")[] = ["ALL", "PUBLISHED", "PENDING", "HIDDEN"];
const VIS_LABEL: Record<string, string> = {
  ALL: "Все", PUBLISHED: "Опубликованные", PENDING: "На модерации", HIDDEN: "Скрытые",
};
const RATINGS: (number | "ALL")[] = ["ALL", 5, 4, 3, 2, 1];

export default function ReviewsPage() {
  const [rows, setRows] = useState<Review[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<ReviewVisibility | "ALL">("ALL");
  const [rating, setRating] = useState<number | "ALL">("ALL");
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);

  const [replyFor, setReplyFor] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [toDelete, setToDelete] = useState<Review | null>(null);
  const pageSize = 8;

  const refresh = useCallback(() => {
    setRows(null);
    listReviews({ search, visibility, rating, page, pageSize }).then((r) => {
      setRows(r.rows);
      setTotal(r.total);
    });
    getReviewAnalytics().then(setAnalytics);
  }, [search, visibility, rating, page]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);
  useEffect(() => { setPage(1); }, [search, visibility, rating]);

  async function moderate(r: Review, v: ReviewVisibility) {
    await setReviewVisibility(r.id, v);
    refresh();
  }
  async function submitReply() {
    if (!replyFor) return;
    await replyToReview(replyFor.id, replyText);
    setReplyFor(null);
    setReplyText("");
    refresh();
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {!analytics ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
          <SkeletonCard height={160} /><SkeletonCard height={160} /><SkeletonCard height={160} />
        </div>
      ) : (
        <MotionGrid className="oa-grid-cards">
          <MotionItem>
            <div className="oa-card oa-card-pad oa-analytics-hero">
              <div style={{ textAlign: "center" }}>
                <div className="oa-analytics-hero-value">{analytics.clinicRating.toFixed(1)}</div>
                <Stars rating={analytics.clinicRating} size={15} />
                <div style={{ fontSize: 12, color: "var(--oa-text-faint)", marginTop: 4 }}>{analytics.totalReviews} отзывов</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                {analytics.ratingDistribution.map((d) => (
                  <div key={d.stars} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ width: 12, color: "var(--oa-text-faint)" }}>{d.stars}</span>
                    <div className="oa-progress" style={{ flex: 1 }}>
                      <div className="oa-progress-bar" style={{ width: `${analytics.totalReviews ? (d.count / analytics.totalReviews) * 100 : 0}%`, background: "#f59e0b" }} />
                    </div>
                    <span style={{ width: 22, textAlign: "right", color: "var(--oa-text-soft)" }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </MotionItem>

          <MotionItem>
            <div className="oa-card oa-card-pad" style={{ height: "100%" }}>
              <SectionHeader title="Лучшие врачи" />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {analytics.bestDoctors.slice(0, 4).map((d) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Avatar name={d.name} size={28} />
                    <span style={{ fontSize: 12.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--oa-success)" }}>{d.rating.toFixed(1)} ★</span>
                  </div>
                ))}
              </div>
            </div>
          </MotionItem>

          <MotionItem>
            <div className="oa-card oa-card-pad" style={{ height: "100%" }}>
              <SectionHeader title="Требуют внимания" />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {analytics.lowestDoctors.slice(0, 4).map((d) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Avatar name={d.name} size={28} tone="amber" />
                    <span style={{ fontSize: 12.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: d.rating < 3.5 ? "var(--oa-danger)" : "var(--oa-warning)" }}>{d.rating.toFixed(1)} ★</span>
                  </div>
                ))}
              </div>
            </div>
          </MotionItem>
        </MotionGrid>
      )}

      <div className="oa-toolbar">
        <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
          <ISearch />
          <input className="oa-input" placeholder="Поиск по пациенту, врачу или тексту" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="oa-chips">
          {VIS.map((v) => <button key={v} className={`oa-chip ${visibility === v ? "oa-chip-active" : ""}`} onClick={() => setVisibility(v)}>{VIS_LABEL[v]}</button>)}
        </div>
        <div className="oa-chips">
          {RATINGS.map((r) => <button key={r} className={`oa-chip ${rating === r ? "oa-chip-active" : ""}`} onClick={() => setRating(r)}>{r === "ALL" ? "Все ★" : `${r}★`}</button>)}
        </div>
      </div>

      {/* List */}
      {!rows ? (
        <div className="oa-card oa-card-pad"><SkeletonRows rows={6} /></div>
      ) : rows.length === 0 ? (
        <div className="oa-card"><EmptyState icon={<IReviews />} title="Отзывы не найдены" sub="Измените фильтры." /></div>
      ) : (
        <MotionGrid className="oa-review-list">
          {rows.map((r) => (
            <MotionItem key={r.id}>
            <div className="oa-card oa-card-pad oa-review-card">
              <div className="oa-review-card-inner">
                <Avatar name={r.patientName} size={42} tone="violet" />
                <div style={{ minWidth: 0 }}>
                  <div className="oa-review-card-top">
                    <span className="oa-review-card-name">{r.patientName}</span>
                    <Stars rating={r.rating} size={14} />
                    <VisibilityBadge visibility={r.visibility} />
                    <span className="oa-review-card-date">
                      {new Date(r.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                  <div className="oa-review-card-meta">{r.doctorName} · {r.serviceName}</div>
                  <p className="oa-review-card-body">{r.comment}</p>

                  {r.reply && (
                    <div className="oa-review-card-reply">
                      <div style={{ fontWeight: 700, color: "var(--oa-accent)", marginBottom: 2 }}>Ответ клиники</div>
                      <span style={{ color: "var(--oa-text-soft)" }}>{r.reply}</span>
                    </div>
                  )}

                  <div className="oa-review-card-actions">
                    <button className="oa-btn oa-btn-soft oa-btn-sm" onClick={() => { setReplyFor(r); setReplyText(r.reply ?? ""); }}><IReply style={{ width: 14, height: 14 }} /> Ответить</button>
                    {r.visibility !== "PUBLISHED" && <button className="oa-btn oa-btn-success oa-btn-sm" onClick={() => moderate(r, "PUBLISHED")}><ICheck style={{ width: 14, height: 14 }} /> Опубликовать</button>}
                    {r.visibility !== "HIDDEN" ? (
                      <button className="oa-btn oa-btn-ghost oa-btn-sm" onClick={() => moderate(r, "HIDDEN")}><IEyeOff style={{ width: 14, height: 14 }} /> Скрыть</button>
                    ) : (
                      <button className="oa-btn oa-btn-ghost oa-btn-sm" onClick={() => moderate(r, "PUBLISHED")}><IEye style={{ width: 14, height: 14 }} /> Показать</button>
                    )}
                    <button className="oa-btn oa-btn-danger oa-btn-sm" onClick={() => setToDelete(r)}><ITrash style={{ width: 14, height: 14 }} /> Удалить</button>
                  </div>
                </div>
              </div>
            </div>
            </MotionItem>
          ))}
        </MotionGrid>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />

      <Modal open={!!replyFor} onClose={() => setReplyFor(null)} title="Ответ на отзыв" sub={replyFor?.patientName}
        footer={
          <>
            <button className="oa-btn oa-btn-ghost" onClick={() => setReplyFor(null)}>Отмена</button>
            <button className="oa-btn oa-btn-primary" onClick={submitReply}>Сохранить ответ</button>
          </>
        }>
        <textarea className="oa-textarea" rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Ваш ответ пациенту..." autoFocus />
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) { await deleteReview(toDelete.id); refresh(); } }}
        title="Удалить отзыв?" message="Отзыв будет удалён из публичного списка. Это действие нельзя отменить." />
    </MotionPage>
  );
}
