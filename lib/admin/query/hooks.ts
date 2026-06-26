"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getDashboardData,
  listPatients,
  getSegmentCounts,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientProfile,
  listDoctors,
  getDoctorAnalytics,
  listAppointments,
  updateAppointmentStatus,
  listServices,
  listReviews,
  getReviewAnalytics,
  approveReview,
  rejectReview,
  deleteReview,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getActivityLog,
  getAnalytics,
  getArchiveSummary,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  setDoctorStatus,
  createService,
  updateService,
  deleteService,
  setServiceActive,
} from "@/lib/admin/services";
import type { PatientInput, PatientQuery } from "@/lib/admin/services/patients";
import type { ReviewQuery } from "@/lib/admin/services/reviews";
import type { AppointmentQuery } from "@/lib/admin/services/appointments";
import type { DoctorQuery, DoctorInput } from "@/lib/admin/services/doctors";
import type { ServiceQuery, ServiceInput } from "@/lib/admin/services/services";
import type { AnalyticsRange } from "@/lib/admin/services/analytics";
import type { AppointmentStatus, Doctor } from "@/lib/admin/types";
import { adminKeys } from "./keys";
import { REFETCH } from "./client";

export function useDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: getDashboardData,
    refetchInterval: REFETCH.dashboard,
  });
}

export function usePatientsList(query: PatientQuery) {
  return useQuery({
    queryKey: adminKeys.patients.list(query as Record<string, unknown>),
    queryFn: () => listPatients(query),
    placeholderData: keepPreviousData,
  });
}

export function usePatientSegmentCounts() {
  return useQuery({
    queryKey: adminKeys.patients.counts(),
    queryFn: getSegmentCounts,
  });
}

export function usePatientProfile(id: string) {
  return useQuery({
    queryKey: adminKeys.patients.detail(id),
    queryFn: () => getPatientProfile(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) => createPatient(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.patients.all() });
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard() });
      void qc.invalidateQueries({ queryKey: adminKeys.notifications.all() });
    },
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PatientInput>) => updatePatient(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.patients.all() });
      void qc.invalidateQueries({ queryKey: adminKeys.patients.detail(id) });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.patients.all() });
    },
  });
}

export function useDoctorsList(query: DoctorQuery = {}) {
  return useQuery({
    queryKey: adminKeys.doctors.list(query as Record<string, unknown>),
    queryFn: () => listDoctors(query),
    placeholderData: keepPreviousData,
  });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, password }: { input: DoctorInput; password?: string }) =>
      createDoctor(input, { password }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.doctors.all() });
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<DoctorInput> }) =>
      updateDoctor(id, patch),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.doctors.all() });
    },
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDoctor(id),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.doctors.all() });
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useSetDoctorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Doctor["status"] }) =>
      setDoctorStatus(id, status),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.doctors.all() });
    },
  });
}

export function useDoctorAnalytics(id: string) {
  return useQuery({
    queryKey: adminKeys.doctors.analytics(id),
    queryFn: () => getDoctorAnalytics(id),
    enabled: !!id,
  });
}

export function useAppointmentsList(query: AppointmentQuery) {
  return useQuery({
    queryKey: adminKeys.bookings.list(query as Record<string, unknown>),
    queryFn: () => listAppointments(query),
    placeholderData: keepPreviousData,
    refetchInterval: REFETCH.bookings,
  });
}

export function usePendingBookings() {
  return useQuery({
    queryKey: adminKeys.bookings.pending(),
    queryFn: () => listAppointments({ status: "PENDING", pageSize: 10 }),
    refetchInterval: REFETCH.pendingBookings,
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: adminKeys.bookings.all() });
      return { id, status };
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.bookings.all() });
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard() });
      void qc.invalidateQueries({ queryKey: adminKeys.notifications.all() });
    },
  });
}

export function useServicesList(query: ServiceQuery = {}) {
  return useQuery({
    queryKey: adminKeys.services.list(query as Record<string, unknown>),
    queryFn: () => listServices(query),
    placeholderData: keepPreviousData,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ServiceInput) => createService(input),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.services.all() });
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ServiceInput> }) =>
      updateService(id, patch),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.services.all() });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.services.all() });
    },
  });
}

export function useSetServiceActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setServiceActive(id, active),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.services.all() });
    },
  });
}

export function useReviewsList(query: ReviewQuery) {
  return useQuery({
    queryKey: adminKeys.reviews.list(query as Record<string, unknown>),
    queryFn: () => listReviews(query),
    placeholderData: keepPreviousData,
  });
}

export function useReviewAnalytics() {
  return useQuery({
    queryKey: adminKeys.reviews.analytics(),
    queryFn: getReviewAnalytics,
  });
}

export function useApproveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveReview,
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.reviews.all() });
      void qc.invalidateQueries({ queryKey: adminKeys.doctors.all() });
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard() });
      void qc.invalidateQueries({ queryKey: adminKeys.notifications.all() });
    },
  });
}

export function useRejectReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectReview,
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.reviews.all() });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteReview,
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.reviews.all() });
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: adminKeys.notifications.list(),
    queryFn: getNotifications,
    refetchInterval: REFETCH.notifications,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.notifications.all() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.notifications.all() });
    },
  });
}

export function useActivityLog(params: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: adminKeys.activity.list(params as Record<string, unknown>),
    queryFn: () => getActivityLog(params),
    placeholderData: keepPreviousData,
  });
}

export function useAnalytics(range: AnalyticsRange) {
  return useQuery({
    queryKey: adminKeys.analytics.range(range.preset),
    queryFn: () => getAnalytics(range),
    placeholderData: keepPreviousData,
  });
}

export function useArchiveSummary() {
  return useQuery({
    queryKey: adminKeys.archive.summary(),
    queryFn: getArchiveSummary,
    staleTime: 60_000,
  });
}
