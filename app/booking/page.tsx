"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ServiceIcon from "@/components/ui/ServiceIcon";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import {
  IconStethoscope, IconDoctor, IconCalendar,
  IconClipboard, IconCheck, IconClock,
} from "@/components/ui/Icons";
import { saveReceipt, updateReceiptStatus, removeReceipt, type ReceiptStatus } from "@/lib/clientReceipt";
import { isSlotConflictRejection } from "@/lib/booking-rejection";
import BookingLoading from "@/components/ui/BookingLoading";
import BookingWeekCalendar from "@/components/booking/BookingWeekCalendar";
import BookingTimeGrid from "@/components/booking/BookingTimeGrid";
import {
  getMondayOfWeek,
  addDaysIso,
  type SlotEntry,
  type WeekDayEntry,
} from "@/lib/slot-availability";
import {
  useLanguage,
  serviceName,
  serviceDesc,
  doctorName,
  doctorSpecialty,
} from "@/lib/i18n";

/* ── Types ───────────────────────────────────────── */
interface Service {
  id: string;
  nameRu: string;
  nameTj?: string | null;
  descriptionRu: string;
  descriptionTj?: string | null;
  durationMin: number;
  price: number | null;
  iconName?: string | null;
}
interface Doctor {
  id: string;
  nameRu: string;
  nameTj?: string | null;
  specialtyRu: string;
  specialtyTj?: string | null;
  photoUrl: string | null;
  workDays: number[];
  workStart: string;
  workEnd: string;
}
interface BookingResult {
  id: string;
  status?: ReceiptStatus;
  date: string;
  dateIso?: string;
  timeSlot: string;
  service: string;
  doctor: string;
  doctorSpecialty?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  price?: number | null;
  paid?: boolean;
}
type Step = "service" | "doctor" | "date" | "time" | "contact" | "confirm";

/* ── Constants ───────────────────────────────────── */

/* ── Helpers ──────────────────────────────────────── */
function formatDate(s: string) { return `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`; }

/* ════════════════════════════════════════════════════
   BOOKING WIZARD
════════════════════════════════════════════════════ */
function BookingWizardInner() {
  const { t, lang } = useLanguage();
  const searchParams    = useSearchParams();
  const presetServiceId = searchParams.get("service");
  /* doctor preset ignored — user must pick service first, then matching doctor */

  /* ── State ──────────────────────────────────────── */
  const [step,            setStep]           = useState<Step>("service");
  const [services,        setServices]       = useState<Service[]>([]);
  const [doctors,         setDoctors]        = useState<Doctor[]>([]);
  const [slots,           setSlots]          = useState<string[]>([]);
  const [slotTimeline,    setSlotTimeline]    = useState<SlotEntry[]>([]);
  const [weekStart,       setWeekStart]       = useState(() => getMondayOfWeek());
  const [weekDays,        setWeekDays]        = useState<WeekDayEntry[]>([]);
  const [weekLoading,     setWeekLoading]     = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDoctor,  setSelectedDoctor]  = useState<Doctor | null>(null);
  const [selectedDate,    setSelectedDate]    = useState("");
  const [selectedTime,    setSelectedTime]    = useState("");
  const [firstName,       setFirstName]       = useState("");
  const [lastName,        setLastName]        = useState("");
  const [phone,           setPhone]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [slotsLoading,    setSlotsLoading]    = useState(false);
  const [error,           setError]           = useState("");
  const [result,          setResult]          = useState<BookingResult | null>(null);
  const [bookingStatus,   setBookingStatus]   = useState<ReceiptStatus>("PENDING");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [rescheduleNotice, setRescheduleNotice] = useState<string | null>(null);

  const STEPS = [
    { id: "service" as Step, label: t.stepService, Icon: IconStethoscope },
    { id: "doctor"  as Step, label: t.stepDoctor,  Icon: IconDoctor },
    { id: "date"    as Step, label: t.stepSchedule, Icon: IconCalendar },
    { id: "contact" as Step, label: t.stepContact, Icon: IconClipboard },
    { id: "confirm" as Step, label: t.stepDone,    Icon: IconCheck },
  ];

  const DAY_NAMES = t.days;
  useEffect(() => {
    setLoading(true);
    fetch("/api/services")
      .then((r) => r.json())
      .then((data: { services?: Service[] }) => {
        const list = data.services ?? [];
        setServices(list);
        if (presetServiceId) {
          const found = list.find((s) => s.id === presetServiceId);
          if (found) { setSelectedService(found); setStep("doctor"); }
        }
      })
      .catch(() => setError(t.errLoadServices))
      .finally(() => setLoading(false));
  }, [presetServiceId]);

  /* ── Load doctors for selected service ────────────── */
  useEffect(() => {
    if (!selectedService) return;
    setLoading(true);
    setDoctors([]);
    setSelectedDoctor(null);
    fetch(`/api/doctors?serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then((data: { doctors?: Doctor[] }) => {
        setDoctors(data.doctors ?? []);
      })
      .catch(() => setError(t.errLoadDoctors))
      .finally(() => setLoading(false));
  }, [selectedService]);

  useEffect(() => {
    if (!selectedDoctor) return;
    setWeekStart(getMondayOfWeek());
  }, [selectedDoctor]);

  function beginReschedule(reason?: string | null) {
    if (result?.id) removeReceipt(result.id);
    setRescheduleNotice(reason ?? rejectionReason);
    setResult(null);
    setBookingStatus("PENDING");
    setRejectionReason(null);
    setSelectedTime("");
    setStep("date");
    setError("");
  }

  /* ── Poll booking status after submit ───────────── */
  useEffect(() => {
    if (step !== "confirm" || !result?.id || bookingStatus !== "PENDING") return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/bookings/status?id=${encodeURIComponent(result!.id)}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { status?: ReceiptStatus; rejectionReason?: string | null };
        if (!data.status || cancelled) return;
        if (data.status === "PENDING") return;

        const reason = data.rejectionReason ?? null;

        if (
          data.status === "REJECTED" &&
          reason &&
          isSlotConflictRejection(reason) &&
          selectedService &&
          selectedDoctor
        ) {
          removeReceipt(result!.id);
          setRescheduleNotice(reason);
          setResult(null);
          setBookingStatus("PENDING");
          setRejectionReason(null);
          setSelectedTime("");
          setStep("date");
          setError("");
          return;
        }

        setBookingStatus(data.status);
        if (data.status === "REJECTED") setRejectionReason(reason);
        updateReceiptStatus(result!.id, data.status, reason);
      } catch {
        /* retry on next tick */
      }
    }

    poll();
    const t = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(t); };
  }, [step, result?.id, bookingStatus, selectedService, selectedDoctor]);

  const loadWeek = useCallback(async () => {
    if (!selectedDoctor) return;
    setWeekLoading(true);
    try {
      const res = await fetch(
        `/api/slots/week?doctorId=${selectedDoctor.id}&weekStart=${weekStart}`
      );
      const data = (await res.json()) as { days?: WeekDayEntry[] };
      setWeekDays(data.days ?? []);
    } catch {
      setError(t.errLoadSlots);
    } finally {
      setWeekLoading(false);
    }
  }, [selectedDoctor, weekStart, t.errLoadSlots]);

  /* ── Load slots ─────────────────────────────────── */
  const loadSlots = useCallback(async (opts?: { silent?: boolean }) => {
    if (!selectedDoctor || !selectedDate) return;
    const silent = opts?.silent ?? false;
    if (!silent) {
      setSlotsLoading(true);
      setSlots([]);
      setSlotTimeline([]);
      setSelectedTime("");
    }
    try {
      const res  = await fetch(`/api/slots?doctorId=${selectedDoctor.id}&date=${selectedDate}`);
      const data = (await res.json()) as { slots?: string[]; timeline?: SlotEntry[] };
      setSlots(data.slots ?? []);
      setSlotTimeline(data.timeline ?? []);
      if (silent) {
        setSelectedTime((prev) => {
          if (!prev) return prev;
          return (data.slots ?? []).includes(prev) ? prev : "";
        });
      }
    } catch {
      if (!silent) setError(t.errLoadSlots);
    } finally {
      if (!silent) setSlotsLoading(false);
    }
  }, [selectedDoctor, selectedDate, t.errLoadSlots]);

  useEffect(() => {
    if (step === "date" && selectedDoctor) loadWeek();
  }, [step, selectedDoctor, weekStart, loadWeek]);

  useEffect(() => {
    if (step === "date" && selectedDoctor && selectedDate) loadSlots();
  }, [step, selectedDate, selectedDoctor, loadSlots]);

  /* Обновляем занятость слотов, пока клиент выбирает время */
  useEffect(() => {
    if (step !== "date" || !selectedDoctor || !selectedDate) return;
    const id = setInterval(() => {
      loadSlots({ silent: true });
      loadWeek();
    }, 20_000);
    return () => clearInterval(id);
  }, [step, selectedDoctor, selectedDate, loadSlots, loadWeek]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const localizedWeekDays = weekDays.map((d) => ({
    ...d,
    dayName: DAY_NAMES[new Date(`${d.date}T12:00:00`).getDay()],
  }));

  function selectDate(iso: string) {
    setSelectedDate(iso);
    setSelectedTime("");
    setError("");
  }

  function selectTime(slot: string) {
    setSelectedTime(slot);
    setError("");
    setStep("contact");
  }

  async function handleSubmit() {
    if (!selectedService || !selectedDoctor || !selectedDate || !selectedTime) return;
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) { setError(t.errFillFields); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id, doctorId: selectedDoctor.id,
          date: selectedDate, timeSlot: selectedTime,
          firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(),
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        booking?: BookingResult & { status?: ReceiptStatus };
        error?: string;
      };
      if (!res.ok || !data.success) { setError(data.error ?? t.errCreateBooking); return; }
      const booking = data.booking;
      if (booking) {
        const svcName = serviceName(selectedService, lang);
        const docName = doctorName(selectedDoctor, lang);
        const docSpec = doctorSpecialty(selectedDoctor, lang);
        const status = booking.status ?? "PENDING";
        saveReceipt({
          id: booking.id,
          firstName: booking.firstName ?? firstName.trim(),
          lastName: booking.lastName ?? lastName.trim(),
          phone: booking.phone ?? phone.trim(),
          service: svcName,
          doctor: docName,
          doctorSpecialty: docSpec,
          dateIso: booking.dateIso ?? selectedDate,
          dateFormatted: booking.date,
          timeSlot: booking.timeSlot,
          price: booking.price ?? selectedService.price ?? null,
          paid: booking.paid ?? false,
          status,
          createdAt: new Date().toISOString(),
        });
        setBookingStatus(status);
        setRejectionReason(null);
        setRescheduleNotice(null);
        setResult({ ...booking, service: svcName, doctor: docName, doctorSpecialty: docSpec, status });
      }
      setStep("confirm");
    } catch {
      setError(t.errNetwork);
    } finally {
      setLoading(false);
    }
  }


  /* ── Render ─────────────────────────────────────── */

  const rescheduleBanner = rescheduleNotice ? (
    <div className="glass-card p-5 mb-6" style={{ borderLeft: "4px solid #fbbf24" }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden>⚠️</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-amber-300 mb-1">{t.rescheduleTitle}</h3>
          <p className="text-sm glass-card-desc leading-relaxed">{t.rescheduleSub}</p>
          <div
            className="mt-3 rounded-xl px-4 py-3"
            style={{
              background: "rgba(239,68,68,0.18)",
              border: "1px solid rgba(248,113,113,0.45)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
            }}
          >
            <div className="text-[10px] uppercase tracking-wider font-semibold text-red-300 mb-1">
              {t.rejectionReason}
            </div>
            <div className="text-sm font-bold text-white leading-snug" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.65)" }}>
              {rescheduleNotice}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="page-pad site-page">
      <div className="max-w-2xl mx-auto">

        <div className="mb-7">
          <h1 className="neon-title text-2xl text-theme font-semibold">{t.bookingTitle}</h1>
          <p className="text-theme-muted text-sm mt-1">{t.bookingSubtitle}</p>
        </div>

        {/* ── Progress indicator ───────────────────── */}
        {step !== "confirm" && (
          <div className="mb-10">
            <div className="flex items-center">
              {STEPS.slice(0, -1).map((s, i) => {
                const done    = i < stepIndex;
                const current = s.id === step;
                return (
                  <div key={s.id} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          done ? "step-dot-done" : current ? "step-dot-current" : "step-dot-pending"
                        }`}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <div className={`text-[10px] mt-1.5 hidden sm:block font-medium transition-colors ${
                        current ? "text-sky-600" : done ? "text-theme-faint" : "text-theme-faint"
                      }`}>
                        {s.label}
                      </div>
                    </div>
                    {i < STEPS.length - 2 && (
                      <div
                        className="flex-1 h-[2px] mx-1 rounded-full transition-all duration-500"
                        style={{ background: done ? "linear-gradient(90deg, #0ea5e9, #38bdf8)" : "#e2e8f0" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Error banner ─────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border text-sm flex items-start gap-3"
            style={{ background:"#fef2f2", borderColor:"#fecaca", color:"#dc2626" }}>
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ════════════════ STEP: SERVICE ═══════════ */}
        {step === "service" && (
          <div>
            <div className="mb-7">
              <h2 className="text-2xl font-semibold text-theme mb-1">{t.selectService}</h2>
              <p className="text-theme-muted text-sm">{t.selectServiceSub}</p>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl shimmer" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSelectedService(s); setSelectedDoctor(null); setStep("doctor"); setError(""); }}
                    className="glass-card service-row-ios w-full text-left p-4 sm:p-5 group transition-transform active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <ServiceIcon
                        name={s.iconName}
                        nameRu={s.nameRu}
                        nameTj={s.nameTj}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base glass-card-title font-semibold mb-1 leading-snug">
                          {serviceName(s, lang)}
                        </div>
                        <div className="text-xs glass-card-desc line-clamp-2 leading-relaxed mb-2">
                          {serviceDesc(s, lang)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs glass-card-meta">
                          <span className="inline-flex items-center gap-1">
                            <IconClock size={13} className="opacity-75" />
                            {s.durationMin} {t.min}
                          </span>
                          {s.price !== null && s.price !== undefined && (
                            <span className="glass-card-price font-semibold">
                              {(s.price as number).toLocaleString()} {t.somoni}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 flex-shrink-0 text-sky-400/80 group-hover:text-sky-300 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════ STEP: DOCTOR ═══════════ */}
        {step === "doctor" && selectedService && (
          <div>
            <div className="flex items-start justify-between mb-7">
              <div>
                <h2 className="text-2xl font-semibold text-theme mb-1">{t.selectDoctor}</h2>
                <p className="text-theme-muted text-sm">{t.selectDoctorSub}</p>
              </div>
              <button onClick={() => setStep("service")} className="text-theme-faint hover:text-sky-600 text-sm transition-colors mt-1">
                {t.back}
              </button>
            </div>

            <div className="inline-flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium mb-6 text-theme theme-pill">
              <ServiceIcon
                name={selectedService.iconName}
                nameRu={selectedService.nameRu}
                nameTj={selectedService.nameTj}
                size="sm"
              />
              {serviceName(selectedService, lang)}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer" />)}
              </div>
            ) : doctors.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <div className="mx-auto mb-4 flex justify-center opacity-70">
                  <IconDoctor size={40} />
                </div>
              <p className="text-theme-muted">{t.noDoctors}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((d) => (
                  <div
                    key={d.id}
                    className="glass-card p-5 group"
                  >
                    <button
                      onClick={() => {
                        setSelectedDoctor(d);
                        setWeekStart(getMondayOfWeek());
                        setSelectedDate("");
                        setSelectedTime("");
                        setStep("date");
                        setError("");
                      }}
                      className="w-full flex items-center gap-4"
                    >
                      <DoctorAvatar
                        photoUrl={d.photoUrl}
                        name={doctorName(d, lang)}
                        size="md"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-bold text-theme group-hover:text-sky-600 transition-colors">
                          {doctorName(d, lang)}
                        </div>
                        <div className="text-sky-400 text-sm font-medium">{doctorSpecialty(d, lang)}</div>
                        <div className="text-theme-faint text-xs mt-1">
                          {d.workDays.map((wd) => DAY_NAMES[wd]).join(", ")} · {d.workStart}–{d.workEnd}
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 theme-pill">
                        <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════ STEP: SCHEDULE (date + time) ═ */}
        {step === "date" && selectedDoctor && (
          <div>
            <div className="flex items-start justify-between mb-7">
              <div>
                <h2 className="text-2xl font-semibold text-theme mb-1">{t.stepSchedule}</h2>
                <p className="text-theme-muted text-sm">{t.selectDateSub}</p>
              </div>
              <button onClick={() => setStep("doctor")} className="text-theme-faint hover:text-sky-600 text-sm transition-colors mt-1">
                {t.back}
              </button>
            </div>

            {rescheduleBanner}

            <div className="flex items-center gap-3 rounded-xl p-3 mb-5 theme-card">
              <DoctorAvatar
                photoUrl={selectedDoctor.photoUrl}
                name={doctorName(selectedDoctor, lang)}
                size="sm"
              />
              <div>
                <div className="text-sm font-semibold text-theme">{doctorName(selectedDoctor, lang)}</div>
                <div className="text-xs text-theme-muted">
                  {t.doctorWorks}: {selectedDoctor.workDays.map((d) => DAY_NAMES[d]).join(", ")} · {selectedDoctor.workStart}–{selectedDoctor.workEnd}
                </div>
              </div>
            </div>

            <BookingWeekCalendar
              days={localizedWeekDays}
              weekStart={weekStart}
              selectedDate={selectedDate}
              loading={weekLoading}
              labels={{
                weekPrev: t.weekPrev,
                weekNext: t.weekNext,
                dayOff: t.dayOff,
                dayFull: t.dayFull,
                dayPast: t.dayPast,
                slotsFree: t.slotsFree,
              }}
              onSelect={selectDate}
              onPrevWeek={() => setWeekStart((w) => addDaysIso(w, -7))}
              onNextWeek={() => setWeekStart((w) => addDaysIso(w, 7))}
            />

            {selectedDate ? (
              slotsLoading || slotTimeline.length > 0 ? (
                <BookingTimeGrid
                  timeline={slotTimeline}
                  selectedTime={selectedTime}
                  loading={slotsLoading}
                  workStart={selectedDoctor.workStart}
                  workEnd={selectedDoctor.workEnd}
                  dateLabel={formatDate(selectedDate)}
                  labels={{
                    slotBooked: t.slotBooked,
                    slotPast: t.slotPast,
                    slotAvailable: t.slotAvailable,
                    pickTime: t.selectTime,
                    workHours: t.workHours,
                  }}
                  onSelect={selectTime}
                />
              ) : (
                <div className="glass-card p-8 text-center mt-5">
                  <div className="text-4xl mb-3">📅</div>
                  <h3 className="text-lg font-semibold text-theme mb-2">{t.noSlots}</h3>
                  <p className="text-theme-muted text-sm">{t.noSlotsSub}</p>
                </div>
              )
            ) : (
              <p className="text-center text-theme-muted text-sm mt-6">{t.pickDayFirst}</p>
            )}
          </div>
        )}

        {/* ════════════════ STEP: CONTACT ══════════ */}
        {step === "contact" && (
          <div>
            <div className="flex items-start justify-between mb-7">
              <div>
                <h2 className="text-2xl font-semibold text-theme mb-1">{t.yourData}</h2>
                <p className="text-theme-muted text-sm">{t.yourDataSub}</p>
              </div>
              <button onClick={() => setStep("date")} className="text-theme-faint hover:text-sky-600 text-sm transition-colors mt-1">
                {t.back}
              </button>
            </div>

            {/* Summary card */}
            <div className="glass-card p-5 mb-6">
              <div className="text-xs font-semibold text-theme-faint uppercase tracking-wider mb-3">{t.yourBooking}</div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-theme-muted">{t.service}</span>
                  <span className="text-sm font-semibold text-theme">{selectedService && serviceName(selectedService, lang)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-theme-muted">{t.doctor}</span>
                  <span className="text-sm font-semibold text-theme">{selectedDoctor && doctorName(selectedDoctor, lang)}</span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t theme-border-b">
                  <span className="text-sm text-theme-muted">{t.datetime}</span>
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700">
                    {formatDate(selectedDate)} · {selectedTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="glass-card p-6 mb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t.firstName} *</label>
                  <input type="text" className="form-input" placeholder={t.firstNamePh} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">{t.lastName} *</label>
                  <input type="text" className="form-input" placeholder={t.lastNamePh} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">{t.phone} *</label>
                <input type="tel" className="form-input text-base" placeholder={t.phonePh} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !firstName.trim() || !lastName.trim() || !phone.trim()}
              className="btn-primary w-full py-4 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t.submitting}
                </span>
              ) : (
                t.confirmBooking
              )}
            </button>
          </div>
        )}

        {/* ════════════════ STEP: CONFIRM ══════════ */}
        {step === "confirm" && result && (
          <div className="text-center py-8">
            {bookingStatus === "PENDING" && (
              <>
                <div className="relative inline-block mb-8">
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #d97706, #f59e0b)",
                      boxShadow: "0 8px 32px rgba(245,158,11,0.35)",
                    }}
                  >
                    <svg className="w-14 h-14 text-white animate-spin" style={{ animationDuration: "2.5s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-3xl font-semibold text-theme mb-3">{t.pendingTitle}</h2>
                <p className="text-theme-muted mb-8 text-lg max-w-md mx-auto">{t.pendingSub}</p>
              </>
            )}

            {bookingStatus === "ACCEPTED" && (
              <>
                <div className="relative inline-block mb-8">
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                      boxShadow: "0 8px 24px rgba(14,165,233,0.25)",
                    }}
                  >
                    <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-3xl font-semibold text-theme mb-3">{t.acceptedTitle}</h2>
                <p className="text-theme-muted text-lg mb-4">{t.acceptedSub}</p>
                <p className="neon-subtitle text-theme-muted text-[11px] tracking-widest mb-8">{t.successNote}</p>
              </>
            )}

            {bookingStatus === "REJECTED" && (
              <>
                <div className="relative inline-block mb-8">
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #dc2626, #ef4444)",
                      boxShadow: "0 8px 32px rgba(239,68,68,0.35)",
                    }}
                  >
                    <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-red-400 mb-3">{t.rejectedTitle}</h2>
                <p className="text-theme-muted mb-6 text-lg max-w-md mx-auto">{t.rejectedSub}</p>

                {rejectionReason && (
                  <div className="glass-card p-5 mb-6 max-w-md mx-auto text-left w-full">
                    <div
                      className="rounded-xl px-4 py-3.5"
                      style={{
                        background: "rgba(239,68,68,0.2)",
                        border: "1px solid rgba(248,113,113,0.5)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                      }}
                    >
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-red-300 mb-1.5">
                        {t.rejectionReason}
                      </div>
                      <div className="text-base font-bold text-white leading-snug" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.7)" }}>
                        {rejectionReason}
                      </div>
                    </div>
                  </div>
                )}

                {selectedService && selectedDoctor && (
                  <button
                    type="button"
                    onClick={() => beginReschedule()}
                    className="btn-primary px-8 mb-4"
                  >
                    {t.pickNewSlot}
                  </button>
                )}
              </>
            )}

            {(bookingStatus === "PENDING" || bookingStatus === "ACCEPTED") && (
            <div
              className="glass-card p-6 text-left max-w-sm mx-auto mb-8"
            >
              <div className="neon-subtitle text-theme-muted text-[10px] tracking-widest mb-4 text-center">
                {t.receiptHeader}
              </div>
              {bookingStatus === "PENDING" && (
                <div className="text-center text-xs font-semibold text-amber-300 mb-4 px-3 py-2 rounded-lg theme-pill">
                  {t.statusPending}
                </div>
              )}
              <div className="space-y-3">
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-theme-faint flex-shrink-0">{t.patient}</span>
                  <span className="text-theme font-semibold text-right">
                    {result.firstName ?? firstName} {result.lastName ?? lastName}
                  </span>
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-theme-faint">{t.phone}</span>
                  <span className="text-theme font-semibold">{result.phone ?? phone}</span>
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-theme-faint">{t.doctor}</span>
                  <span className="text-theme font-semibold text-right">{result.doctor}</span>
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-theme-faint">{t.service}</span>
                  <span className="text-theme font-semibold text-right">{result.service}</span>
                </div>
                <div className="pt-3 border-t theme-border-b flex justify-between items-center gap-4">
                  <span className="text-theme-faint text-sm">{t.datetime}</span>
                  <span className="text-sm font-bold neon-blue px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(14,165,233,0.15)", border: "1px solid rgba(56,189,248,0.25)" }}>
                    {result.date} · {result.timeSlot}
                  </span>
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-theme-faint">{t.payment}</span>
                  <span className={`font-semibold ${result.paid ? "neon-blue" : "text-amber-300"}`}>
                    {result.paid ? t.paid : t.unpaid}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t theme-border-b text-xs text-theme-faint text-center font-mono">
                № {result.id}
              </div>
            </div>
            )}

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              {bookingStatus !== "REJECTED" && (
                <Link href="/" className="btn-primary">{t.toHome}</Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingWizardInner />
    </Suspense>
  );
}
