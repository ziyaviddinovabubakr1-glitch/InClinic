"use client";

import { useEffect, useState } from "react";
import {
  useServicesList,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useSetServiceActive,
} from "@/lib/admin/query/hooks";
import { useAdminPermissions } from "@/components/providers/AdminPermissionsProvider";
import { money } from "@/lib/admin/services";
import type { Service } from "@/lib/admin/types";
import type { ServiceInput } from "@/lib/admin/services";
import { Modal, ConfirmDialog } from "@/components/admin/Modal";
import { SkeletonRows, EmptyState } from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import { IPlus, ISearch, IEdit, ITrash, IEye, IEyeOff, IServices } from "@/components/admin/icons";

const EMPTY: ServiceInput = { name: "", description: "", price: 100, durationMin: 30, active: true };

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceInput>(EMPTY);
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const { can } = useAdminPermissions();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 180);
    return () => clearTimeout(t);
  }, [search]);

  const { data: services, isLoading } = useServicesList({ search: debounced });
  const createMut = useCreateService();
  const updateMut = useUpdateService();
  const deleteMut = useDeleteService();
  const setActiveMut = useSetServiceActive();

  const canManage = can("service:update");
  const canCreate = can("service:create");
  const canDelete = can("service:delete");
  const saving = createMut.isPending || updateMut.isPending;

  function openCreate() { setEditing(null); setForm(EMPTY); setFormOpen(true); }
  function openEdit(s: Service) {
    setEditing(s);
    setForm({ name: s.name, description: s.description, price: s.price, durationMin: s.durationMin, active: s.active });
    setFormOpen(true);
  }
  async function save() {
    if (!form.name.trim()) return;
    if (editing) await updateMut.mutateAsync({ id: editing.id, patch: form });
    else await createMut.mutateAsync(form);
    setFormOpen(false);
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="oa-toolbar">
        <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
          <ISearch />
          <input className="oa-input" placeholder="Поиск услуги" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {canCreate && (
          <button className="oa-btn oa-btn-primary" onClick={openCreate}><IPlus /> Добавить услугу</button>
        )}
      </div>

      <div className="oa-card oa-table-card">
        {isLoading && !services ? (
          <div className="oa-card-pad"><SkeletonRows rows={8} /></div>
        ) : !services?.length ? (
          <EmptyState icon={<IServices />} title="Услуги не найдены" sub="Добавьте первую услугу." />
        ) : (
          <div className="oa-table-wrap oa-table-responsive">
            <table className="oa-table">
              <thead>
                <tr>
                  <th>Услуга</th>
                  <th>Цена</th>
                  <th>Длительность</th>
                  <th>Продажи</th>
                  <th>Доход</th>
                  <th>Популярность</th>
                  <th>Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="oa-table-col-patient-first" data-label="Услуга">
                      <div className="oa-cell-strong">{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--oa-text-faint)", marginTop: 2, maxWidth: 280, lineHeight: 1.4 }}>{s.description}</div>
                    </td>
                    <td className="oa-cell-strong" data-label="Цена">{money(s.price)}</td>
                    <td className="oa-cell-soft" data-label="Длительность">{s.durationMin} мин</td>
                    <td className="oa-cell-strong" data-label="Продажи">{s.salesCount}</td>
                    <td className="oa-cell-strong" data-label="Доход">{money(s.revenue)}</td>
                    <td data-label="Популярность" style={{ minWidth: 100 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="oa-progress oa-progress-sm" style={{ flex: 1 }}><div className="oa-progress-bar" style={{ width: `${s.popularity}%` }} /></div>
                        <span style={{ fontSize: 11.5, color: "var(--oa-text-faint)", width: 32 }}>{s.popularity}%</span>
                      </div>
                    </td>
                    <td data-label="Статус">
                      {s.active
                        ? <span className="oa-badge oa-badge-confirmed">активна</span>
                        : <span className="oa-badge oa-badge-hidden">скрыта</span>}
                    </td>
                    <td data-label="Действия">
                      <div className="oa-table-actions">
                        {canManage && (
                          <button className="oa-btn oa-btn-soft oa-btn-sm" onClick={() => openEdit(s)} title="Изменить"><IEdit style={{ width: 14, height: 14 }} /></button>
                        )}
                        {canManage && (
                          <button className="oa-btn oa-btn-ghost oa-btn-icon" onClick={() => setActiveMut.mutate({ id: s.id, active: !s.active })} aria-label="Скрыть/показать">{s.active ? <IEyeOff /> : <IEye />}</button>
                        )}
                        {canDelete && (
                          <button className="oa-btn oa-btn-danger oa-btn-icon" onClick={() => setToDelete(s)} aria-label="Удалить"><ITrash /></button>
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Редактировать услугу" : "Новая услуга"}
        footer={
          <>
            <button className="oa-btn oa-btn-ghost" onClick={() => setFormOpen(false)}>Отмена</button>
            <button className="oa-btn oa-btn-primary" onClick={save} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</button>
          </>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label className="oa-label">Название</label><input className="oa-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="oa-label">Описание</label><textarea className="oa-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
            <div><label className="oa-label">Цена</label><input className="oa-input" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><label className="oa-label">Длит. (мин)</label><input className="oa-input" type="number" min={5} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} /></div>
            <div>
              <label className="oa-label">Статус</label>
              <select className="oa-select" value={form.active ? "1" : "0"} onChange={(e) => setForm({ ...form, active: e.target.value === "1" })}>
                <option value="1">Активна</option>
                <option value="0">Скрыта</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteMut.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
        title="Удалить услугу?" message={`Услуга «${toDelete?.name}» будет удалена. Историческая статистика продаж сохраняется в архиве.`} />
    </MotionPage>
  );
}
