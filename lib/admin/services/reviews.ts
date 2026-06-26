import type {
  Paginated,
  Review,
  ReviewAnalytics,
  ReviewStatus,
} from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";

export interface ReviewQuery {
  search?: string;
  status?: ReviewStatus | "ALL";
  rating?: number | "ALL";
  doctorId?: string;
  page?: number;
  pageSize?: number;
}

type ReviewsResponse = {
  rows: Review[];
  total: number;
  page: number;
  pageSize: number;
};

export function listReviews(query: ReviewQuery = {}): Promise<Paginated<Review>> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.rating && query.rating !== "ALL") params.set("rating", String(query.rating));
  if (query.doctorId) params.set("doctorId", query.doctorId);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  return adminFetch<ReviewsResponse>(`/api/admin/reviews?${params}`);
}

export function approveReview(id: string): Promise<Review> {
  return adminFetch<{ review: Review }>(`/api/admin/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "APPROVED" }),
  }).then((d) => d.review);
}

export function rejectReview(id: string): Promise<Review> {
  return adminFetch<{ review: Review }>(`/api/admin/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "REJECTED" }),
  }).then((d) => d.review);
}

export function createReview(input: {
  bookingId: string;
  rating: number;
  comment?: string;
  status?: ReviewStatus;
}): Promise<Review> {
  return adminFetch<{ review: Review }>("/api/admin/reviews", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((d) => d.review);
}

export function deleteReview(id: string): Promise<{ ok: boolean }> {
  return adminFetch<{ success: boolean }>(`/api/admin/reviews/${id}`, {
    method: "DELETE",
  })
    .then(() => ({ ok: true }))
    .catch(() => ({ ok: false }));
}

export function getReviewAnalytics(): Promise<ReviewAnalytics> {
  return adminFetch<{ analytics: ReviewAnalytics }>(
    "/api/admin/reviews?analytics=1",
  ).then((d) => d.analytics);
}

/** @deprecated use approveReview / rejectReview */
export function setReviewVisibility(
  id: string,
  visibility: "PUBLISHED" | "PENDING" | "HIDDEN",
): Promise<Review | null> {
  const status: ReviewStatus =
    visibility === "PUBLISHED" ? "APPROVED" : visibility === "HIDDEN" ? "REJECTED" : "PENDING";
  return adminFetch<{ review: Review }>(`/api/admin/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
    .then((d) => d.review)
    .catch(() => null);
}

/** @deprecated reviews have no reply field */
export function replyToReview(_id: string, _reply: string): Promise<Review | null> {
  return Promise.resolve(null);
}
