"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import AdminBrandLogo from "@/components/admin/AdminBrandLogo";
import OwnerAvatar from "@/components/admin/OwnerAvatar";
import { IShield, IArchive, IDownload } from "@/components/admin/icons";
import { getOwnerAvatarUrl, setOwnerAvatarUrl, clearOwnerAvatarUrl } from "@/lib/owner-avatar";
import { OWNER_NAME } from "@/lib/admin/owner";

export default function SettingsPage() {
  const [name, setName] = useState("InClinic");
  const [phone, setPhone] = useState("+992 90 000-00-00");
  const [email, setEmail] = useState("info@inclinic.tj");
  const [address, setAddress] = useState("г. Душанбе, ул. Рудаки 1");
  const [currency, setCurrency] = useState("TJS");
  const [language, setLanguage] = useState("ru");
  const [open, setOpen] = useState("08:00");
  const [close, setClose] = useState("18:00");
  const [saved, setSaved] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");
  const [hasAvatar, setHasAvatar] = useState(false);

  useEffect(() => {
    setHasAvatar(!!getOwnerAvatarUrl());
    const onUpdate = () => setHasAvatar(!!getOwnerAvatarUrl());
    window.addEventListener("inclinic-owner-avatar-updated", onUpdate);
    return () => window.removeEventListener("inclinic-owner-avatar-updated", onUpdate);
  }, []);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarMsg("Выберите изображение (JPG, PNG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg("Файл не больше 2 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setOwnerAvatarUrl(reader.result);
        setHasAvatar(true);
        setAvatarMsg("Фото сохранено ✓");
        setTimeout(() => setAvatarMsg(""), 2000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 820, margin: "0 auto", width: "100%" }}>
      <div className="oa-card oa-card-pad">
        <SectionHeader title="Профиль владельца" sub={`Аватар отображается в панели — ${OWNER_NAME}`} />
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: 16, background: "var(--oa-surface-2)", borderRadius: 14, border: "1px solid var(--oa-border)" }}>
          <OwnerAvatar size={72} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Фото владельца</div>
            <div style={{ fontSize: 12.5, color: "var(--oa-text-faint)", marginTop: 4 }}>
              JPG или PNG, до 2 МБ. Показывается в шапке и боковом меню.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <label className="oa-btn oa-btn-primary oa-btn-sm" style={{ cursor: "pointer" }}>
                Загрузить фото
                <input type="file" accept="image/*" onChange={onAvatarPick} style={{ display: "none" }} />
              </label>
              {hasAvatar && (
                <button
                  type="button"
                  className="oa-btn oa-btn-ghost oa-btn-sm"
                  onClick={() => { clearOwnerAvatarUrl(); setHasAvatar(false); setAvatarMsg("Фото удалено"); setTimeout(() => setAvatarMsg(""), 2000); }}
                >
                  Удалить
                </button>
              )}
            </div>
            {avatarMsg && <div style={{ fontSize: 12, color: "var(--oa-success)", marginTop: 8, fontWeight: 600 }}>{avatarMsg}</div>}
          </div>
        </div>
      </div>

      <div className="oa-card oa-card-pad">
        <SectionHeader title="Профиль клиники" sub="Основная информация и контакты" />
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20, padding: 16, background: "var(--oa-surface-2)", borderRadius: 14, border: "1px solid var(--oa-border)" }}>
          <AdminBrandLogo variant="icon" size="md" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Логотип клиники</div>
            <div style={{ fontSize: 12.5, color: "var(--oa-text-faint)", marginTop: 2 }}>Используется на сайте и в панели владельца</div>
          </div>
          <AdminBrandLogo variant="full" size="md" className="oa-settings-wordmark" />
        </div>
        <div className="oa-grid-2" style={{ gap: 14 }}>
          <Field label="Название клиники" value={name} onChange={setName} />
          <Field label="Телефон" value={phone} onChange={setPhone} />
          <Field label="Email" value={email} onChange={setEmail} />
          <Field label="Адрес" value={address} onChange={setAddress} />
        </div>
      </div>

      <div className="oa-card oa-card-pad">
        <SectionHeader title="Параметры" sub="Рабочее время, язык и валюта" />
        <div className="oa-grid-2" style={{ gap: 14 }}>
          <Field label="Открытие" value={open} onChange={setOpen} type="time" />
          <Field label="Закрытие" value={close} onChange={setClose} type="time" />
          <div>
            <label className="oa-label">Язык по умолчанию</label>
            <select className="oa-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="ru">Русский</option>
              <option value="tj">Таджикский</option>
            </select>
          </div>
          <div>
            <label className="oa-label">Валюта</label>
            <select className="oa-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="TJS">Сомони (TJS)</option>
              <option value="USD">Доллар (USD)</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
          <button className="oa-btn oa-btn-primary" onClick={save}>Сохранить изменения</button>
          {saved && <span style={{ fontSize: 13, color: "var(--oa-success)", fontWeight: 600 }}>Сохранено ✓</span>}
        </div>
      </div>

      {/* Backup Center */}
      <div className="oa-card oa-card-pad">
        <SectionHeader title="Центр резервных копий" sub="Создание и восстановление данных" action={<span className="oa-soon-pill">Скоро</span>} />
        <div className="oa-grid-auto">
          {[
            { icon: IArchive, label: "Создать копию" },
            { icon: IDownload, label: "Скачать копию" },
            { icon: IShield, label: "Восстановить" },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <button key={i} className="oa-card oa-card-hover" disabled style={{ padding: 16, textAlign: "left", cursor: "not-allowed", opacity: 0.7, background: "var(--oa-surface-2)" }}>
                <div className="oa-kpi-icon oa-tone-blue" style={{ margin: 0, width: 34, height: 34 }}><Icon style={{ width: 17, height: 17 }} /></div>
                <div style={{ fontWeight: 650, fontSize: 13.5, marginTop: 10 }}>{b.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <PasswordChangeCard />
    </MotionPage>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="oa-label">{label}</label>
      <input className="oa-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PasswordChangeCard() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function closeForm() {
    setOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function changePassword() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Не удалось сменить пароль");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Пароль успешно изменён ✓");
      setTimeout(() => setMessage(""), 4000);
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="oa-card oa-card-pad">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <IShield style={{ width: 18, height: 18, opacity: 0.85 }} />
              Безопасность
            </div>
            <div style={{ fontSize: 12.5, color: "var(--oa-text-faint)", marginTop: 6 }}>
              Смена пароля для входа в админку
            </div>
          </div>
          <button type="button" className="oa-btn oa-btn-ghost" onClick={() => setOpen(true)}>
            Сменить пароль
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="oa-card oa-card-pad">
      <SectionHeader
        title="Смена пароля"
        sub="Введите текущий и новый пароль"
        action={
          <button type="button" className="oa-btn oa-btn-ghost oa-btn-sm" onClick={closeForm}>
            Скрыть
          </button>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, maxWidth: 420 }}>
        <Field
          label="Текущий пароль"
          value={currentPassword}
          onChange={setCurrentPassword}
          type="password"
        />
        <Field
          label="Новый пароль"
          value={newPassword}
          onChange={setNewPassword}
          type="password"
        />
        <Field
          label="Повторите новый пароль"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type="password"
        />
      </div>
      <div style={{ fontSize: 12.5, color: "var(--oa-text-faint)", marginTop: 10 }}>
        Минимум 8 символов. После смены вы останетесь в панели.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
        <button
          type="button"
          className="oa-btn oa-btn-primary"
          onClick={changePassword}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
        >
          {loading ? "Сохранение…" : "Сохранить новый пароль"}
        </button>
        <button type="button" className="oa-btn oa-btn-ghost" onClick={closeForm} disabled={loading}>
          Отмена
        </button>
        {message && (
          <span style={{ fontSize: 13, color: "var(--oa-success)", fontWeight: 600 }}>{message}</span>
        )}
        {error && (
          <span style={{ fontSize: 13, color: "var(--oa-danger, #ef4444)", fontWeight: 600 }}>{error}</span>
        )}
      </div>
    </div>
  );
}
