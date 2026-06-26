import type { Review, ReviewStatus } from "@prisma/client";
import type { Review as UiReview, ReviewAnalytics } from "@/lib/admin/types";

type ReviewRow = Review & {
  patient: { firstName: string; lastName: string };
  doctor: { nameRu: string };
  booking: {
    serviceId: string;
    service: { nameRu: string };
  };
};

export function mapDbReviewToUi(r: ReviewRow): UiReview {
  return {
    id: r.id,
    bookingId: r.bookingId,
    appointmentId: r.bookingId,
    doctorId: r.doctorId,
    doctorName: r.doctor.nameRu,
    patientId: r.patientId,
    patientName: `${r.patient.firstName} ${r.patient.lastName}`.trim(),
    serviceId: r.booking.serviceId,
    serviceName: r.booking.service.nameRu,
    rating: r.rating,
    comment: r.comment ?? "",
    date: r.createdAt.toISOString(),
    status: r.status as UiReview["status"],
  };
}

export function buildReviewAnalytics(
  reviews: ReviewRow[],
  doctorStats: Map<string, { averageRating: number; reviewCount: number }>,
  doctors: { id: string; nameRu: string }[],
): ReviewAnalytics {
  const approved = reviews.filter((r) => r.status === "APPROVED");
  const totalReviews = reviews.length;
  const clinicRating =
    approved.length > 0
      ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  const doctorRows = doctors
    .map((d) => {
      const stats = doctorStats.get(d.id);
      return {
        id: d.id,
        name: d.nameRu,
        rating: stats?.averageRating ?? 0,
        reviews: stats?.reviewCount ?? 0,
      };
    })
    .filter((d) => d.reviews > 0);

  const bestDoctors = [...doctorRows]
    .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    .slice(0, 5);

  const lowestDoctors = [...doctorRows]
    .sort((a, b) => a.rating - b.rating || b.reviews - a.reviews)
    .slice(0, 5);

  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;
  const approvedCount = approved.length;

  return {
    clinicRating: Math.round(clinicRating * 10) / 10,
    totalReviews,
    pendingCount,
    approvedCount,
    ratingDistribution,
    bestDoctors,
    lowestDoctors,
  };
}

export function uiStatusToDb(status: string): ReviewStatus | null {
  if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
    return status;
  }
  return null;
}
