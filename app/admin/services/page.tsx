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
import { MotionPage, StaggerGrid, StaggerItem } from "@/components/admin/motion";
import SegmentedControl from "@/components/admin/SegmentedControl";
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

      <div className="oa-entity-grid-wrap">
        {isLoading && !services ? (
          <div className="oa-card oa-card-pad"><SkeletonRows rows={6} /></div>
        ) : !services?.length ? (
          <div className="oa-card"><EmptyState icon={<IServices />} title="Услуги не найдены" sub="Добавьте первую услугу." /></div>
        ) : (
          <StaggerGrid className="oa-entity-grid">
            {services.map((s) => (
              <StaggerItem key={s.id}>
                <article className="oa-entity-card oa-service-card">
                  <div className="oa-entity-card-top">
                    <div className="oa-entity-card-head-main">
                      <div className="oa-service-name">{s.name}</div>
                      {s.description && <div className="oa-service-desc">{s.description}</div>}
                    </div>
                    {s.active
                      ? <span className="oa-badge oa-badge-confirmed">активна</span>
                      : <span className="oa-badge oa-badge-hidden">скрыта</span>}
                  </div>

                  <div className="oa-entity-stat-grid">
                    <div className="oa-entity-stat">
                      <div className="oa-entity-stat-value">{money(s.price)}</div>
                      <div className="oa-entity-stat-label">Цена</div>
                    </div>
                    <div className="oa-entity-stat">
                      <div className="oa-entity-stat-value">{s.durationMin} мин</div>
                      <div className="oa-entity-stat-label">Длительность</div>
                    </div>
                    <div className="oa-entity-stat">
                      <div className="oa-entity-stat-value">{s.salesCount}</div>
                      <div className="oa-entity-stat-label">Продажи</div>
                    </div>
                    <div className="oa-entity-stat">
                      <div className="oa-entity-stat-value">{money(s.revenue)}</div>
                      <div className="oa-entity-stat-label">Доход</div>
                    </div>
                  </div>

                  <div className="oa-entity-popularity">
                    <div className="oa-progress oa-progress-sm"><div className="oa-progress-bar" style={{ width: `${s.popularity}%` }} /></div>
                    <span>{s.popularity}%</span>
                  </div>

                  <div className="oa-entity-card-foot">
                    <span style={{ fontSize: 11, color: "var(--oa-text-faint)" }}>Популярность</span>
                    <div className="oa-entity-card-actions">
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
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGrid>
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
              <SegmentedControl
                options={[
                  { id: "1", label: "Активна" },
                  { id: "0", label: "Скрыта" },
                ]}
                value={form.active ? "1" : "0"}
                onChange={(v) => setForm({ ...form, active: v === "1" })}
              />
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
