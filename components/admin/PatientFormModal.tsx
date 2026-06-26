"use client";

import { useState } from "react";
import type { PatientGender, PatientInput } from "@/lib/admin/services/patients";
import { Modal } from "./Modal";

const GENDERS: { value: PatientGender | ""; label: string }[] = [
  { value: "", label: "Не указан" },
  { value: "MALE", label: "Мужской" },
  { value: "FEMALE", label: "Женский" },
  { value: "OTHER", label: "Другой" },
  { value: "UNKNOWN", label: "Неизвестно" },
];

const EMPTY: PatientInput = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  birthDate: null,
  gender: null,
  address: "",
  notes: "",
};

export default function PatientFormModal({
  open,
  onClose,
  onSave,
  initial,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: PatientInput) => Promise<void>;
  initial?: Partial<PatientInput>;
  title: string;
}) {
  const [form, setForm] = useState<PatientInput>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setForm({ ...EMPTY, ...initial });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError("Заполните имя, фамилию и телефон");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email?.trim() || undefined,
        address: form.address?.trim() || null,
        notes: form.notes?.trim() || null,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="oa-patient-form">
        <div className="oa-form-grid-2">
          <label className="oa-field">
            <span className="oa-field-label">Имя</span>
            <input
              className="oa-input"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </label>
          <label className="oa-field">
            <span className="oa-field-label">Фамилия</span>
            <input
              className="oa-input"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </label>
        </div>
        <label className="oa-field">
          <span className="oa-field-label">Телефон</span>
          <input
            className="oa-input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </label>
        <label className="oa-field">
          <span className="oa-field-label">Email</span>
          <input
            className="oa-input"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <div className="oa-form-grid-2">
          <label className="oa-field">
            <span className="oa-field-label">Дата рождения</span>
            <input
              className="oa-input"
              type="date"
              value={form.birthDate ?? ""}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value || null })}
            />
          </label>
          <label className="oa-field">
            <span className="oa-field-label">Пол</span>
            <select
              className="oa-select"
              value={form.gender ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  gender: (e.target.value || null) as PatientGender | null,
                })
              }
            >
              {GENDERS.map((g) => (
                <option key={g.label} value={g.value}>{g.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="oa-field">
          <span className="oa-field-label">Адрес</span>
          <input
            className="oa-input"
            value={form.address ?? ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>
        <label className="oa-field">
          <span className="oa-field-label">Заметки</span>
          <textarea
            className="oa-input oa-textarea"
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        {error && <p className="oa-form-error">{error}</p>}
        <div className="oa-form-actions">
          <button type="button" className="oa-btn oa-btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="oa-btn oa-btn-primary" disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
