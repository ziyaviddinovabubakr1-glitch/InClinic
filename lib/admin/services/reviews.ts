import type {
  Paginated,
  Review,
  ReviewAnalytics,
  ReviewVisibility,
} from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { clone, delay } from "./util";

export interface ReviewQuery {
  search?: string;
  visibility?: ReviewVisibility | "ALL";
  rating?: number | "ALL";
  doctorId?: string;
  page?: number;
  pageSize?: number;
}

export function listReviews(query: ReviewQuery = {}): Promise<Paginated<Review>> {
  const { reviews } = getDataset();
  let rows = [...reviews];

  if (query.visibility && query.visibility !== "ALL") {
    rows = rows.filter((r) => r.visibility === query.visibility);
  }
  if (query.rating && query.rating !== "ALL") {
    rows = rows.filter((r) => r.rating === query.rating);
  }
  if (query.doctorId) {
    rows = rows.filter((r) => r.doctorId === query.doctorId);
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.patientName.toLowerCase().includes(q) ||
        r.doctorName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const total = rows.length;
  const start = (page - 1) * pageSize;

  return delay(
    clone({ rows: rows.slice(start, start + pageSize), total, page, pageSize }),
  );
}

export function setReviewVisibility(
  id: string,
  visibility: ReviewVisibility,
): Promise<Review | null> {
  const ds = getDataset();
  const review = ds.reviews.find((r) => r.id === id);
  if (!review) return delay(null);
  review.visibility = visibility;
  return delay(clone(review));
}

export function replyToReview(id: string, reply: string): Promise<Review | null> {
  const ds = getDataset();
  const review = ds.reviews.find((r) => r.id === id);
  if (!review) return delay(null);
  review.reply = reply.trim() || null;
  return delay(clone(review));
}

export function deleteReview(id: string): Promise<{ ok: boolean }> {
  const ds = getDataset();
  const idx = ds.reviews.findIndex((r) => r.id === id);
  if (idx >= 0) ds.reviews.splice(idx, 1);
  return delay({ ok: idx >= 0 });
}

export function getReviewAnalytics(): Promise<ReviewAnalytics> {
  const { reviews, doctors } = getDataset();
  const visible = reviews.filter((r) => r.visibility !== "HIDDEN");

  const clinicRating = visible.length
    ? Math.round((visible.reduce((s, r) => s + r.rating, 0) / visible.length) * 10) / 10
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: visible.filter((r) => r.rating === stars).length,
  }));

  const doctorStats = doctors
    .map((d) => {
      const docReviews = visible.filter((r) => r.doctorId === d.id);
      const rating = docReviews.length
        ? Math.round(
            (docReviews.reduce((s, r) => s + r.rating, 0) / docReviews.length) * 10,
          ) / 10
        : 0;
      return { id: d.id, name: d.fullName, rating, reviews: docReviews.length };
    })
    .filter((d) => d.reviews > 0);

  const bestDoctors = [...doctorStats].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const lowestDoctors = [...doctorStats].sort((a, b) => a.rating - b.rating).slice(0, 5);

  return delay(
    clone({
      clinicRating,
      totalReviews: visible.length,
      ratingDistribution,
      bestDoctors,
      lowestDoctors,
    }),
  );
}
