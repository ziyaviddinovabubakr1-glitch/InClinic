"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listDoctors, createDoctor, updateDoctor, deleteDoctor, setDoctorStatus,
  getDoctorAnalytics, money,
} from "@/lib/admin/services";
import type { Doctor, DoctorAnalytics, DoctorStatus } from "@/lib/admin/types";
import type { DoctorInput } from "@/lib/admin/services";
import { Modal, Drawer, ConfirmDialog } from "@/components/admin/Modal";
import { AreaChart } from "@/components/admin/charts";
import {
  Avatar, Stars, SectionHeader, SkeletonRows, EmptyState,
  StatTile, doctorPerformanceScore,
} from "@/components/admin/ui";
import { MotionPage, MotionGrid, MotionItem } from "@/components/admin/motion";
import {
  IPlus, ISearch, IEdit, ITrash, IEye, IEyeOff, IAnalytics, IDoctors,
} from "@/components/admin/icons";

const EMPTY_FORM: DoctorInput = {
  photoUrl: null,
  fullName: "",
  specialty: "",
  experienceYears: 1,
  education: "",
  languages: ["Русский"],
  consultationPrice: 150,
  workSchedule: { days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00" },
  status: "ACTIVE",
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DoctorStatus | "ALL">("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState<DoctorInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Doctor | null>(null);
  const [analyticsFor, setAnalyticsFor] = useState<Doctor | null>(null);
  const [analytics, setAnalytics] = useState<DoctorAnalytics | null>(null);

  const refresh = useCallback(() => {
    setDoctors(null);
    listDoctors({ search, status: statusFilter }).then(setDoctors);
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }
  function openEdit(d: Doctor) {
    setEditing(d);
    setForm({
      photoUrl: d.photoUrl, fullName: d.fullName, specialty: d.specialty,
      experienceYears: d.experienceYears, education: d.education,
      languages: d.languages, consultationPrice: d.consultationPrice,
      workSchedule: d.workSchedule, status: d.status,
    });
    setFormOpen(true);
  }

  async function save() {
    if (!form.fullName.trim() || !form.specialty.trim()) return;
    setSaving(true);
    if (editing) await updateDoctor(editing.id, form);
    else await createDoctor(form);
    setSaving(false);
    setFormOpen(false);
    refresh();
  }

  async function toggleStatus(d: Doctor) {
    await setDoctorStatus(d.id, d.status === "ACTIVE" ? "HIDDEN" : "ACTIVE");
    refresh();
  }

  async function openAnalytics(d: Doctor) {
    setAnalyticsFor(d);
    setAnalytics(null);
    setAnalytics(await getDoctorAnalytics(d.id));
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="oa-toolbar">
        <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
          <ISearch />
          <input className="oa-input" placeholder="Поиск по имени или специализации" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="oa-chips">
          {(["ALL", "ACTIVE", "HIDDEN"] as const).map((s) => (
            <button key={s} className={`oa-chip ${statusFilter === s ? "oa-chip-active" : ""}`} onClick={() => setStatusFilter(s)}>
              {s === "ALL" ? "Все" : s === "ACTIVE" ? "Активные" : "Скрытые"}
            </button>
          ))}
        </div>
        <button className="oa-btn oa-btn-primary" onClick={openCreate}><IPlus /> Добавить врача</button>
      </div>

      {!doctors ? (
        <div className="oa-card oa-card-pad"><SkeletonRows rows={6} /></div>
      ) : doctors.length === 0 ? (
        <div className="oa-card"><EmptyState icon={<IDoctors />} title="Врачи не найдены" sub="Измените фильтры или добавьте нового врача." /></div>
      ) : (
        <MotionGrid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 18 }}>
          {doctors.map((d) => {
            const score = doctorPerformanceScore(d);
            return (
              <MotionItem key={d.id}>
                <div className="oa-doctor-card">
                  <div className="oa-doctor-card-header">
                    <Avatar name={d.fullName} size={52} tone={d.status === "ACTIVE" ? "blue" : "amber"} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="oa-doctor-card-name">{d.fullName}</span>
                        {d.status === "HIDDEN" && <span className="oa-badge oa-badge-hidden">скрыт</span>}
                      </div>
                      <div className="oa-doctor-card-specialty">{d.specialty} · {d.experienceYears} лет</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                        <Stars rating={d.rating} size={13} />
                        <span style={{ fontSize: 12, color: "var(--oa-text-faint)" }}>{d.rating.toFixed(1)}</span>
                        <span style={{ fontSize: 12, color: "var(--oa-text-faint)" }}>· {money(d.consultationPrice)}</span>
                      </div>
                    </div>
                    <div className="oa-doctor-score">
                      <div className="oa-doctor-score-value">{score}</div>
                      <div className="oa-doctor-score-label">Score</div>
                    </div>
                  </div>

                  <div className="oa-doctor-stats">
                    <StatTile label="Пациенты" value={String(d.patientsCount)} />
                    <StatTile label="Приёмы" value={String(d.appointmentsCount)} />
                    <StatTile label="Доход" value={money(d.revenueGenerated)} />
                  </div>

                  <div className="oa-doctor-actions">
                    <button className="oa-btn oa-btn-soft oa-btn-sm" style={{ flex: 1 }} onClick={() => openAnalytics(d)}>
                      <IAnalytics style={{ width: 15, height: 15 }} /> Аналитика
                    </button>
                    <button className="oa-btn oa-btn-ghost oa-btn-icon" onClick={() => openEdit(d)} aria-label="Редактировать"><IEdit /></button>
                    <button className="oa-btn oa-btn-ghost oa-btn-icon" onClick={() => toggleStatus(d)} aria-label="Скрыть/показать">{d.status === "ACTIVE" ? <IEyeOff /> : <IEye />}</button>
                    <button className="oa-btn oa-btn-danger oa-btn-icon" onClick={() => setToDelete(d)} aria-label="Удалить"><ITrash /></button>
                  </div>
                </div>
              </MotionItem>
            );
          })}
        </MotionGrid>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)}
        title={editing ? "Редактировать врача" : "Новый врач"}
        sub="Заполните карточку врача"
        footer={
          <>
            <button className="oa-btn oa-btn-ghost" onClick={() => setFormOpen(false)}>Отмена</button>
            <button className="oa-btn oa-btn-primary" onClick={save} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</button>
          </>
        }>
        <DoctorForm form={form} setForm={setForm} />
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) { await deleteDoctor(toDelete.id); refresh(); } }}
        title="Удалить врача?"
        message={`Врач «${toDelete?.fullName}» будет удалён из списка. Историческая статистика и завершённые приёмы сохраняются в архиве.`} />

      <Drawer open={!!analyticsFor} onClose={() => { setAnalyticsFor(null); setAnalytics(null); }}
        title={analyticsFor?.fullName ?? ""} sub={analyticsFor?.specialty}>
        {!analytics ? <SkeletonRows rows={5} /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatTile label="Доход" value={money(analytics.revenue)} large />
              <StatTile label="Приёмы" value={String(analytics.appointments)} large />
              <StatTile label="Пациенты" value={String(analytics.patients)} large />
              <StatTile label="Повторные" value={String(analytics.repeatPatients)} large />
              <StatTile label="Рейтинг" value={analytics.rating.toFixed(1)} large />
              <StatTile label="Загрузка" value={`${analytics.load}%`} large />
            </div>
            <div className="oa-chart-card" style={{ padding: 18 }}>
              <SectionHeader title="Эффективность" sub="Доход по месяцам" />
              <AreaChart data={analytics.performance} height={180} color="#3b82f6" />
            </div>
          </div>
        )}
      </Drawer>
    </MotionPage>
  );
}

function DoctorForm({ form, setForm }: { form: DoctorInput; setForm: (f: DoctorInput) => void }) {
  const ALL_LANGS = ["Русский", "Таджикский", "Английский", "Узбекский"];
  const WEEKDAYS = [
    { n: 1, l: "Пн" }, { n: 2, l: "Вт" }, { n: 3, l: "Ср" }, { n: 4, l: "Чт" },
    { n: 5, l: "Пт" }, { n: 6, l: "Сб" }, { n: 7, l: "Вс" },
  ];
  const set = (patch: Partial<DoctorInput>) => setForm({ ...form, ...patch });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label className="oa-label">ФИО</label><input className="oa-input" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="Иванов Иван" /></div>
        <div><label className="oa-label">Специализация</label><input className="oa-input" value={form.specialty} onChange={(e) => set({ specialty: e.target.value })} placeholder="Кардиолог" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label className="oa-label">Опыт (лет)</label><input className="oa-input" type="number" min={0} value={form.experienceYears} onChange={(e) => set({ experienceYears: Number(e.target.value) })} /></div>
        <div><label className="oa-label">Стоимость приёма</label><input className="oa-input" type="number" min={0} value={form.consultationPrice} onChange={(e) => set({ consultationPrice: Number(e.target.value) })} /></div>
      </div>
      <div><label className="oa-label">Образование</label><textarea className="oa-textarea" rows={2} value={form.education} onChange={(e) => set({ education: e.target.value })} placeholder="Университет, год" /></div>
      <div>
        <label className="oa-label">Языки</label>
        <div className="oa-chips">
          {ALL_LANGS.map((l) => {
            const on = form.languages.includes(l);
            return (
              <button key={l} type="button" className={`oa-chip ${on ? "oa-chip-active" : ""}`}
                onClick={() => set({ languages: on ? form.languages.filter((x) => x !== l) : [...form.languages, l] })}>
                {l}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="oa-label">Рабочие дни</label>
        <div className="oa-chips">
          {WEEKDAYS.map((d) => {
            const on = form.workSchedule.days.includes(d.n);
            return (
              <button key={d.n} type="button" className={`oa-chip ${on ? "oa-chip-active" : ""}`}
                onClick={() => set({ workSchedule: { ...form.workSchedule, days: on ? form.workSchedule.days.filter((x) => x !== d.n) : [...form.workSchedule.days, d.n].sort() } })}>
                {d.l}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
        <div><label className="oa-label">Начало</label><input className="oa-input" type="time" value={form.workSchedule.start} onChange={(e) => set({ workSchedule: { ...form.workSchedule, start: e.target.value } })} /></div>
        <div><label className="oa-label">Конец</label><input className="oa-input" type="time" value={form.workSchedule.end} onChange={(e) => set({ workSchedule: { ...form.workSchedule, end: e.target.value } })} /></div>
        <div>
          <label className="oa-label">Статус</label>
          <select className="oa-select" value={form.status} onChange={(e) => set({ status: e.target.value as DoctorStatus })}>
            <option value="ACTIVE">Активен</option>
            <option value="HIDDEN">Скрыт</option>
          </select>
        </div>
      </div>
    </div>
  );
}
