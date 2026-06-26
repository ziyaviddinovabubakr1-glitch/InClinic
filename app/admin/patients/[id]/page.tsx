"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  usePatientProfile,
  useUpdatePatient,
  useDeletePatient,
} from "@/lib/admin/query/hooks";
import { useAdminPermissions } from "@/components/providers/AdminPermissionsProvider";
import { money } from "@/lib/admin/services";
import {
  Avatar, SegmentBadge, StatusBadge, StatTile, SkeletonCard, EmptyState,
} from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import PatientFormModal from "@/components/admin/PatientFormModal";
import { IArrowLeft, IEdit, ITrash, IPhone, IMail } from "@/components/admin/icons";
import { ConfirmDialog } from "@/components/admin/Modal";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const GENDER_LABEL: Record<string, string> = {
  MALE: "Мужской", FEMALE: "Женский", OTHER: "Другой", UNKNOWN: "Не указан",
};

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { can } = useAdminPermissions();

  const { data: profile, isLoading, error: queryError } = usePatientProfile(id);
  const updatePatient = useUpdatePatient(id);
  const deletePatientMut = useDeletePatient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const error = queryError instanceof Error ? queryError.message : queryError ? "Пациент не найден" : "";

  if (error && !isLoading) {
    return (
      <MotionPage>
        <EmptyState title="Пациент не найден" sub={error} />
        <Link href="/admin/patients" className="oa-btn oa-btn-ghost oa-btn-sm" style={{ marginTop: 16 }}>
          <IArrowLeft style={{ width: 14, height: 14 }} /> К списку
        </Link>
      </MotionPage>
    );
  }

  if (isLoading || !profile) {
    return (
      <MotionPage className="oa-patient-profile">
        <SkeletonCard height={80} />
        <div className="oa-profile-grid">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={140} />)}
        </div>
      </MotionPage>
    );
  }

  return (
    <MotionPage className="oa-patient-profile">
      <div className="oa-profile-header">
        <Link href="/admin/patients" className="oa-btn oa-btn-ghost oa-btn-sm">
          <IArrowLeft style={{ width: 14, height: 14 }} /> Пациенты
        </Link>
        <div className="oa-profile-header-main">
          <Avatar name={profile.fullName} size={56} tone="violet" />
          <div className="oa-profile-header-text">
            <h1 className="oa-profile-name">{profile.fullName}</h1>
            <div className="oa-profile-meta">
              <span>{profile.phone}</span>
              {profile.age != null && <span>· {profile.age} лет</span>}
              <SegmentBadge segment={profile.segment} />
            </div>
            <div className="oa-profile-meta oa-profile-meta-sub">
              Зарегистрирован {formatDate(profile.registeredAt)}
            </div>
          </div>
          <div className="oa-profile-header-actions">
            {can("patient:update") && (
              <button type="button" className="oa-btn oa-btn-ghost oa-btn-sm" onClick={() => setEditOpen(true)}>
                <IEdit style={{ width: 14, height: 14 }} /> Редактировать
              </button>
            )}
            {can("patient:delete") && (
              <button type="button" className="oa-btn oa-btn-ghost oa-btn-sm" onClick={() => setDeleteOpen(true)}>
                <ITrash style={{ width: 14, height: 14 }} /> Удалить
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="oa-profile-stats">
        <StatTile label="Визитов" value={String(profile.visitsCount)} large />
        <StatTile label="Записей" value={String(profile.appointmentsCount)} large />
        <StatTile label="Оплачено" value={money(profile.totalPaid)} large />
        <StatTile label="Отзывов" value={String(profile.reviewsCount)} large />
      </div>

      <div className="oa-profile-grid">
        <section className="oa-panel oa-panel-rail">
          <div className="oa-panel-head oa-panel-head--row">
            <span className="oa-panel-title">Личные данные</span>
          </div>
          <dl className="oa-dl">
            <div><dt>Телефон</dt><dd>{profile.phone}</dd></div>
            <div><dt>Email</dt><dd>{profile.email || "—"}</dd></div>
            <div><dt>Дата рождения</dt><dd>{formatDate(profile.birthDate)}</dd></div>
            <div><dt>Пол</dt><dd>{profile.gender ? GENDER_LABEL[profile.gender] : "—"}</dd></div>
            <div><dt>Адрес</dt><dd>{profile.address || "—"}</dd></div>
          </dl>
        </section>

        <section className="oa-panel oa-panel-rail">
          <div className="oa-panel-head oa-panel-head--row">
            <span className="oa-panel-title">Медицинские заметки</span>
          </div>
          <p className="oa-notes-block">
            {profile.notes?.trim() || "Заметок пока нет."}
          </p>
        </section>

        <section className="oa-panel oa-panel-table oa-profile-span-2">
          <div className="oa-panel-head oa-panel-head--row">
            <span className="oa-panel-title">Предстоящие визиты</span>
            <span className="oa-panel-meta">{profile.upcomingAppointments.length}</span>
          </div>
          {profile.upcomingAppointments.length === 0 ? (
            <div className="oa-panel-empty">Нет предстоящих записей</div>
          ) : (
            <div className="oa-timeline">
              {profile.upcomingAppointments.map((a) => (
                <div key={a.id} className="oa-timeline-row">
                  <div className="oa-timeline-date">{a.date} · {a.time}</div>
                  <div className="oa-timeline-body">
                    <div className="oa-cell-strong">{a.serviceName}</div>
                    <div className="oa-cell-soft">{a.doctorName}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="oa-panel oa-panel-table oa-profile-span-2">
          <div className="oa-panel-head oa-panel-head--row">
            <span className="oa-panel-title">История посещений</span>
            <span className="oa-panel-meta">{profile.pastAppointments.length}</span>
          </div>
          {profile.pastAppointments.length === 0 ? (
            <div className="oa-panel-empty">История пуста</div>
          ) : (
            <div className="oa-table-wrap">
              <table className="oa-table oa-table-dense">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Врач</th>
                    <th>Услуга</th>
                    <th>Статус</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.pastAppointments.map((a) => (
                    <tr key={a.id}>
                      <td className="oa-cell-soft">{a.date} {a.time}</td>
                      <td>{a.doctorName}</td>
                      <td>{a.serviceName}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="oa-cell-strong">{money(a.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="oa-panel oa-panel-rail oa-profile-span-2">
          <div className="oa-panel-head oa-panel-head--row">
            <span className="oa-panel-title">Платежи</span>
            <span className="oa-panel-meta">{profile.payments.length}</span>
          </div>
          {profile.payments.length === 0 ? (
            <div className="oa-panel-empty">Нет завершённых оплат</div>
          ) : (
            <div className="oa-timeline">
              {profile.payments.map((p) => (
                <div key={p.id} className="oa-timeline-row">
                  <div className="oa-timeline-date">
                    {new Date(p.date).toLocaleDateString("ru-RU")}
                  </div>
                  <div className="oa-timeline-body">
                    <div className="oa-cell-strong">{p.serviceName}</div>
                  </div>
                  <div className="oa-cell-strong">{money(p.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <PatientFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Редактировать пациента"
        initial={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          email: profile.email,
          birthDate: profile.birthDate,
          gender: profile.gender,
          address: profile.address,
          notes: profile.notes,
        }}
        onSave={async (data) => {
          await updatePatient.mutateAsync(data);
          setEditOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Удалить пациента?"
        message="Пациент с историей визитов будет скрыт (soft delete). Полное удаление возможно только без записей. Активные записи нужно отменить заранее."
        confirmLabel="Удалить"
        danger
        onConfirm={async () => {
          const r = await deletePatientMut.mutateAsync(id);
          if (r.ok) router.push("/admin/patients");
        }}
      />
    </MotionPage>
  );
}
