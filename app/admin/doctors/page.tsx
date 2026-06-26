"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useDoctorsList,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useSetDoctorStatus,
} from "@/lib/admin/query/hooks";
import { useAdminPermissions } from "@/components/providers/AdminPermissionsProvider";
import { money } from "@/lib/admin/services";
import type { Doctor, DoctorStatus } from "@/lib/admin/types";
import type { DoctorInput } from "@/lib/admin/services";
import { Modal, ConfirmDialog } from "@/components/admin/Modal";
import {
  Avatar, Stars, SkeletonRows, EmptyState,
  doctorPerformanceScore,
} from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import {
  IPlus, ISearch, IEdit, ITrash, IEye, IEyeOff, IAnalytics, IDoctors,
} from "@/components/admin/icons";
import { setDoctorCredentials } from "@/lib/doctor-credentials";

const EMPTY_FORM: DoctorInput = {
  photoUrl: null,
  fullName: "",
  phone: "",
  specialty: "",
  experienceYears: 1,
  education: "",
  languages: ["Русский"],
  consultationPrice: 150,
  workSchedule: { days: [1, 2, 3, 4, 5, 6], start: "09:00", end: "17:00" },
  status: "ACTIVE",
};

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState<DoctorStatus | "ALL">("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState<DoctorInput>(EMPTY_FORM);
  const [password, setPassword] = useState("");

  const [toDelete, setToDelete] = useState<Doctor | null>(null);
  const { can } = useAdminPermissions();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 180);
    return () => clearTimeout(t);
  }, [search]);

  const { data: doctors, isLoading } = useDoctorsList({ search: debounced, status: statusFilter });
  const createDoctorMut = useCreateDoctor();
  const updateDoctorMut = useUpdateDoctor();
  const deleteDoctorMut = useDeleteDoctor();
  const setStatusMut = useSetDoctorStatus();

  const canManage = can("doctor:update");
  const canCreate = can("doctor:create");
  const canDelete = can("doctor:delete");

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPassword("");
    setFormOpen(true);
  }
  function openEdit(d: Doctor) {
    setEditing(d);
    setForm({
      photoUrl: d.photoUrl, fullName: d.fullName, phone: d.phone, specialty: d.specialty,
      experienceYears: d.experienceYears, education: d.education,
      languages: d.languages, consultationPrice: d.consultationPrice,
      workSchedule: d.workSchedule, status: d.status,
    });
    setPassword("");
    setFormOpen(true);
  }

  async function save() {
    if (!form.fullName.trim() || !form.specialty.trim() || !form.phone.trim()) return;
    if (!editing && password.trim().length < 6) return;
    if (editing) {
      await updateDoctorMut.mutateAsync({ id: editing.id, patch: form });
      if (password.trim().length >= 6) setDoctorCredentials(form.phone, password.trim());
    } else {
      await createDoctorMut.mutateAsync({ input: form, password: password.trim() });
    }
    setFormOpen(false);
  }

  async function toggleStatus(d: Doctor) {
    await setStatusMut.mutateAsync({
      id: d.id,
      status: d.status === "ACTIVE" ? "HIDDEN" : "ACTIVE",
    });
  }

  const saving = createDoctorMut.isPending || updateDoctorMut.isPending;

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="oa-toolbar">
        <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
          <ISearch />
          <input className="oa-input" placeholder="Поиск по имени, специализации или телефону" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="oa-chips">
          {(["ALL", "ACTIVE", "HIDDEN"] as const).map((s) => (
            <button key={s} className={`oa-chip ${statusFilter === s ? "oa-chip-active" : ""}`} onClick={() => setStatusFilter(s)}>
              {s === "ALL" ? "Все" : s === "ACTIVE" ? "Активные" : "Скрытые"}
            </button>
          ))}
        </div>
        {canCreate && (
          <button className="oa-btn oa-btn-primary" onClick={openCreate}><IPlus /> Добавить врача</button>
        )}
      </div>

      <div className="oa-card oa-table-card">
        {isLoading && !doctors ? (
          <div className="oa-card-pad"><SkeletonRows rows={8} /></div>
        ) : !doctors?.length ? (
          <EmptyState icon={<IDoctors />} title="Врачи не найдены" sub="Измените фильтры или добавьте нового врача." />
        ) : (
          <div className="oa-table-wrap oa-table-responsive">
            <table className="oa-table">
              <thead>
                <tr>
                  <th>Врач</th>
                  <th>Телефон</th>
                  <th>Рейтинг</th>
                  <th>Пациенты</th>
                  <th>Приёмы</th>
                  <th>Доход</th>
                  <th>Score</th>
                  <th>Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => {
                  const score = doctorPerformanceScore(d);
                  return (
                    <tr key={d.id}>
                      <td className="oa-table-col-patient-first" data-label="Врач">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={d.fullName} size={36} tone={d.status === "ACTIVE" ? "blue" : "amber"} />
                          <div style={{ minWidth: 0 }}>
                            <div className="oa-cell-strong">{d.fullName}</div>
                            <div style={{ fontSize: 12, color: "var(--oa-text-faint)" }}>{d.specialty} · {d.experienceYears} лет</div>
                          </div>
                        </div>
                      </td>
                      <td className="oa-cell-soft" data-label="Телефон" style={{ fontSize: 12.5 }}>{d.phone}</td>
                      <td data-label="Рейтинг">
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Stars rating={d.rating} size={12} />
                          <span className="oa-cell-strong">{d.rating.toFixed(1)}</span>
                          <span className="oa-cell-soft" style={{ fontSize: 11 }}>({d.reviewCount})</span>
                        </div>
                      </td>
                      <td className="oa-cell-strong" data-label="Пациенты">{d.patientsCount}</td>
                      <td className="oa-cell-strong" data-label="Приёмы">{d.appointmentsCount}</td>
                      <td className="oa-cell-strong" data-label="Доход">{money(d.revenueGenerated)}</td>
                      <td className="oa-cell-strong" data-label="Score">{score}</td>
                      <td data-label="Статус">
                        {d.status === "HIDDEN"
                          ? <span className="oa-badge oa-badge-hidden">скрыт</span>
                          : <span className="oa-badge oa-badge-confirmed">активен</span>}
                      </td>
                      <td data-label="Действия">
                        <div className="oa-table-actions">
                          <Link
                            href={`/admin/doctors/${d.id}/analytics`}
                            className="oa-btn oa-btn-soft oa-btn-sm"
                            title="Аналитика"
                          >
                            <IAnalytics style={{ width: 14, height: 14 }} />
                          </Link>
                          {canManage && (
                            <button className="oa-btn oa-btn-ghost oa-btn-icon" onClick={() => openEdit(d)} aria-label="Редактировать"><IEdit /></button>
                          )}
                          {canManage && (
                            <button className="oa-btn oa-btn-ghost oa-btn-icon" onClick={() => toggleStatus(d)} aria-label="Скрыть/показать">{d.status === "ACTIVE" ? <IEyeOff /> : <IEye />}</button>
                          )}
                          {canDelete && (
                            <button className="oa-btn oa-btn-danger oa-btn-icon" onClick={() => setToDelete(d)} aria-label="Удалить"><ITrash /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)}
        title={editing ? "Редактировать врача" : "Новый врач"}
        sub={editing ? "Изменение данных врача" : "Врач входит через сайт inclinic — не через админку"}
        maxWidth={520}
        footer={
          <>
            <button className="oa-btn oa-btn-ghost" onClick={() => setFormOpen(false)}>Отмена</button>
            <button className="oa-btn oa-btn-primary" onClick={save} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</button>
          </>
        }>
        <DoctorForm
          form={form}
          setForm={setForm}
          password={password}
          setPassword={setPassword}
          isEdit={!!editing}
        />
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteDoctorMut.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
        title="Удалить врача?"
        message={`Врач «${toDelete?.fullName}» будет удалён из списка. Историческая статистика и завершённые приёмы сохраняются в архиве.`} />
    </MotionPage>
  );
}

function DoctorForm({
  form, setForm, password, setPassword, isEdit,
}: {
  form: DoctorInput;
  setForm: (f: DoctorInput) => void;
  password: string;
  setPassword: (v: string) => void;
  isEdit: boolean;
}) {
  const [advanced, setAdvanced] = useState(false);
  const ALL_LANGS = ["Русский", "Таджикский", "Английский", "Узбекский"];
  const WEEKDAYS = [
    { n: 1, l: "Пн" }, { n: 2, l: "Вт" }, { n: 3, l: "Ср" }, { n: 4, l: "Чт" },
    { n: 5, l: "Пт" }, { n: 6, l: "Сб" }, { n: 7, l: "Вс" },
  ];
  const set = (patch: Partial<DoctorInput>) => setForm({ ...form, ...patch });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="oa-hint-box">
        Телефон — логин врача на сайте <strong>/doctor</strong>. Пароль задаётся здесь; в админку врачи не входят.
      </div>
      <div><label className="oa-label">ФИО</label><input className="oa-input" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="Иванов Иван" /></div>
      <div className="oa-grid-2">
        <div><label className="oa-label">Телефон (логин)</label><input className="oa-input" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+992 90 000 00 00" /></div>
        <div><label className="oa-label">Специализация</label><input className="oa-input" value={form.specialty} onChange={(e) => set({ specialty: e.target.value })} placeholder="Кардиолог" /></div>
      </div>
      <div>
        <label className="oa-label">{isEdit ? "Новый пароль (необязательно)" : "Пароль для входа"}</label>
        <input className="oa-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? "Оставьте пустым, если не менять" : "Минимум 6 символов"} autoComplete="new-password" />
      </div>

      <button type="button" className="oa-btn oa-btn-ghost oa-btn-sm oa-advanced-toggle" onClick={() => setAdvanced((v) => !v)}>
        {advanced ? "Скрыть дополнительно" : "Дополнительные поля"}
      </button>

      {advanced && (
        <>
          <div className="oa-grid-2">
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
          <div className="oa-grid-3" style={{ alignItems: "end" }}>
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
        </>
      )}
    </div>
  );
}
