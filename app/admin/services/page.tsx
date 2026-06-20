"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listServices, createService, updateService, deleteService, setServiceActive, money,
} from "@/lib/admin/services";
import type { Service } from "@/lib/admin/types";
import type { ServiceInput } from "@/lib/admin/services";
import { Modal, ConfirmDialog } from "@/components/admin/Modal";
import { SectionHeader, SkeletonRows, EmptyState, StatTile } from "@/components/admin/ui";
import { MotionPage, MotionGrid, MotionItem } from "@/components/admin/motion";
import { IPlus, ISearch, IEdit, ITrash, IEye, IEyeOff, IServices } from "@/components/admin/icons";

const EMPTY: ServiceInput = { name: "", description: "", price: 100, durationMin: 30, active: true };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const refresh = useCallback(() => {
    setServices(null);
    listServices({ search }).then(setServices);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  function openCreate() { setEditing(null); setForm(EMPTY); setFormOpen(true); }
  function openEdit(s: Service) {
    setEditing(s);
    setForm({ name: s.name, description: s.description, price: s.price, durationMin: s.durationMin, active: s.active });
    setFormOpen(true);
  }
  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) await updateService(editing.id, form);
    else await createService(form);
    setSaving(false);
    setFormOpen(false);
    refresh();
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="oa-toolbar">
        <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
          <ISearch />
          <input className="oa-input" placeholder="Поиск услуги" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="oa-btn oa-btn-primary" onClick={openCreate}><IPlus /> Добавить услугу</button>
      </div>

      {!services ? (
        <div className="oa-card oa-card-pad"><SkeletonRows rows={6} /></div>
      ) : services.length === 0 ? (
        <div className="oa-card"><EmptyState icon={<IServices />} title="Услуги не найдены" sub="Добавьте первую услугу." /></div>
      ) : (
        <MotionGrid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
          {services.map((s) => (
            <MotionItem key={s.id}>
            <div className="oa-card oa-card-pad oa-card-hover">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14.5 }}>{s.name}</span>
                    {!s.active && <span className="oa-badge oa-badge-hidden">скрыта</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--oa-text-soft)", marginTop: 3, lineHeight: 1.45 }}>{s.description}</div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, whiteSpace: "nowrap" }}>{money(s.price)}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
                <StatTile label="Продажи" value={String(s.salesCount)} />
                <StatTile label="Доход" value={money(s.revenue)} />
                <StatTile label="Длит." value={`${s.durationMin}м`} />
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--oa-text-faint)", marginBottom: 4 }}>
                  <span>Популярность</span><span>{s.popularity}%</span>
                </div>
                <div className="oa-progress"><div className="oa-progress-bar" style={{ width: `${s.popularity}%` }} /></div>
              </div>

              <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
                <button className="oa-btn oa-btn-soft oa-btn-sm" style={{ flex: 1 }} onClick={() => openEdit(s)}><IEdit style={{ width: 14, height: 14 }} /> Изменить</button>
                <button className="oa-btn oa-btn-ghost oa-btn-icon" onClick={async () => { await setServiceActive(s.id, !s.active); refresh(); }} aria-label="Скрыть/показать">{s.active ? <IEyeOff /> : <IEye />}</button>
                <button className="oa-btn oa-btn-danger oa-btn-icon" onClick={() => setToDelete(s)} aria-label="Удалить"><ITrash /></button>
              </div>
            </div>
            </MotionItem>
          ))}
        </MotionGrid>
      )}

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
        onConfirm={async () => { if (toDelete) { await deleteService(toDelete.id); refresh(); } }}
        title="Удалить услугу?" message={`Услуга «${toDelete?.name}» будет удалена. Историческая статистика продаж сохраняется в архиве.`} />
    </MotionPage>
  );
}
