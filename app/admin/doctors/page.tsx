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
} from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import SegmentedControl from "@/components/admin/SegmentedControl";
import SegmentedMultiToggle from "@/components/admin/SegmentedMultiToggle";
import {
  IPlus, ISearch, IEdit, ITrash, IEye, IEyeOff, IAnalytics, IDoctors,
} from "@/components/admin/icons";
import { setDoctorCredentials } from "@/lib/doctor-credentials";

const STATUS_FILTERS = [
  { id: "ALL" as const, label: "Все" },
  { id: "ACTIVE" as const, label: "Активные" },
  { id: "HIDDEN" as const, label: "Скрытые" },
];

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

  function runSearch(next?: string) {
    setDebounced((next ?? search).trim());
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="oa-toolbar">
        <form
          className="oa-search oa-search-gold"
          style={{ flex: 1, minWidth: 220 }}
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
        >
          <ISearch />
          <input
            className="oa-input"
            type="search"
            placeholder="Поиск по имени, специализации или телефону"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск врачей"
          />
          <button type="submit" className="oa-search-submit" aria-label="Найти">
            <ISearch style={{ width: 16, height: 16 }} />
          </button>
        </form>
        <SegmentedControl
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
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
          <div className="oa-table-wrap oa-table-no-scroll">
            <table className="oa-table oa-table-compact oa-table-doctors">
              <colgroup>
                <col className="oa-col-doctor" />
                <col className="oa-col-rate" />
                <col className="oa-col-num" />
                <col className="oa-col-num" />
                <col className="oa-col-money" />
                <col className="oa-col-status" />
                <col className="oa-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>Врач</th>
                  <th>Рейтинг</th>
                  <th>Пац.</th>
                  <th>Приёмы</th>
                  <th>Доход</th>
                  <th>Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                    <tr key={d.id}>
                      <td className="oa-table-col-patient-first" data-label="Врач">
                        <div className="oa-doctor-cell">
                          <Avatar name={d.fullName} size={26} tone={d.status === "ACTIVE" ? "blue" : "amber"} />
                          <div className="oa-doctor-cell-text">
                            <div className="oa-doctor-cell-name" title={d.fullName}>{d.fullName}</div>
                            <div className="oa-doctor-cell-meta">{d.specialty} · {d.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Рейтинг">
                        <div className="oa-doctor-rating">
                          <Stars rating={d.rating} size={9} />
                          <span className="oa-cell-strong">{d.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="oa-cell-strong oa-cell-num" data-label="Пациенты">{d.patientsCount}</td>
                      <td className="oa-cell-strong oa-cell-num" data-label="Приёмы">{d.appointmentsCount}</td>
                      <td className="oa-cell-strong oa-cell-money" data-label="Доход">{money(d.revenueGenerated)}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)}
        title={editing ? "Редактировать врача" : "Новый врач"}
        sub={editing ? "Изменение данных врача" : "Врач входит через сайт inclinic — не через админку"}
        maxWidth={520}
        premium
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
    <div className="oa-form-premium">
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
            <SegmentedMultiToggle
              options={ALL_LANGS.map((l) => ({ id: l, label: l }))}
              value={form.languages}
              onChange={(languages) => set({ languages })}
            />
          </div>
          <div>
            <label className="oa-label">Рабочие дни</label>
            <SegmentedMultiToggle
              options={WEEKDAYS.map((d) => ({ id: String(d.n), label: d.l }))}
              value={form.workSchedule.days.map(String)}
              onChange={(days) =>
                set({
                  workSchedule: {
                    ...form.workSchedule,
                    days: days.map(Number).sort((a, b) => a - b),
                  },
                })
              }
            />
          </div>
          <div className="oa-grid-3" style={{ alignItems: "end" }}>
            <div><label className="oa-label">Начало</label><input className="oa-input" type="time" value={form.workSchedule.start} onChange={(e) => set({ workSchedule: { ...form.workSchedule, start: e.target.value } })} /></div>
            <div><label className="oa-label">Конец</label><input className="oa-input" type="time" value={form.workSchedule.end} onChange={(e) => set({ workSchedule: { ...form.workSchedule, end: e.target.value } })} /></div>
            <div>
              <label className="oa-label">Статус</label>
              <SegmentedControl
                options={[
                  { id: "ACTIVE", label: "Активен" },
                  { id: "HIDDEN", label: "Скрыт" },
                ]}
                value={form.status}
                onChange={(status) => set({ status })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
