"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import SegmentedControl from "@/components/admin/SegmentedControl";
import AdminBrandLogo from "@/components/admin/AdminBrandLogo";
import OwnerAvatar from "@/components/admin/OwnerAvatar";
import AdminIcon3d from "@/components/admin/AdminIcon3d";
import { IShield, IArchive, IDownload, IActivity } from "@/components/admin/icons";
import { getOwnerAvatarUrl, setOwnerAvatarUrl, clearOwnerAvatarUrl } from "@/lib/owner-avatar";
import {
  getBrandAsset, setBrandAsset, clearBrandAsset, type BrandAsset,
} from "@/lib/clinic-brand";
import {
  backupMetaFromPayload,
  createClinicBackup,
  downloadClinicBackup,
  loadBackupLocally,
  parseBackupFile,
  restoreClinicBackupFromFile,
  type BackupMeta,
} from "@/lib/admin/services";
import { ConfirmDialog } from "@/components/admin/Modal";
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
        <SectionHeader title="Брендинг" sub="Логотипы сайта, админки и иконка вкладки браузера" />
        <div className="oa-brand-upload-grid">
          <BrandUpload
            asset="siteLogo"
            title="Логотип сайта"
            hint="Главная страница и публичные разделы. PNG или SVG, до 2 МБ."
            previewVariant="full"
          />
          <BrandUpload
            asset="adminLogo"
            title="Логотип админки"
            hint="Боковое меню панели владельца. Квадратная иконка или горизонтальный логотип."
            previewVariant="icon"
          />
          <BrandUpload
            asset="favicon"
            title="Favicon"
            hint="Иконка во вкладке браузера. Рекомендуется 64×64 или 512×512 PNG."
            previewVariant="icon"
            previewSize={48}
          />
        </div>
      </div>

      <div className="oa-card oa-card-pad">
        <SectionHeader title="Профиль клиники" sub="Основная информация и контакты" />
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20, padding: 14, background: "var(--oa-surface-2)", borderRadius: 14, border: "1px solid var(--oa-border)" }}>
          <AdminBrandLogo variant="icon" size="md" context="admin" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Текущий логотип админки</div>
            <div style={{ fontSize: 12.5, color: "var(--oa-text-faint)", marginTop: 2 }}>Загрузите выше или используется стандартный</div>
          </div>
          <AdminBrandLogo variant="full" size="md" context="admin" className="oa-settings-wordmark" />
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
            <SegmentedControl
              options={[
                { id: "ru", label: "Русский" },
                { id: "tj", label: "Таджикский" },
              ]}
              value={language}
              onChange={setLanguage}
              className="oa-segmented-fluid"
            />
          </div>
          <div>
            <label className="oa-label">Валюта</label>
            <SegmentedControl
              options={[
                { id: "TJS", label: "Сомони" },
                { id: "USD", label: "Доллар" },
              ]}
              value={currency}
              onChange={setCurrency}
              className="oa-segmented-fluid"
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
          <button className="oa-btn oa-btn-primary" onClick={save}>Сохранить изменения</button>
          {saved && <span style={{ fontSize: 13, color: "var(--oa-success)", fontWeight: 600 }}>Сохранено ✓</span>}
        </div>
      </div>

      {/* Backup Center */}
      <BackupCenterCard />

      <ActivityLogCard />

      <ArchiveVaultCard />

      <PasswordChangeCard />
    </MotionPage>
  );
}

function BackupCenterCard() {
  const [meta, setMeta] = useState<BackupMeta | null>(() => {
    const local = loadBackupLocally();
    return local ? backupMetaFromPayload(local) : null;
  });
  const [busy, setBusy] = useState<"create" | "download" | "restore" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<string | null>(null);

  function showOk(text: string) {
    setError(null);
    setMessage(text);
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleCreate() {
    setBusy("create");
    setError(null);
    try {
      const { meta: next } = await createClinicBackup();
      setMeta(next);
      showOk(
        `Копия создана: ${next.counts.patients} пациентов, ${next.counts.bookings} записей, ${next.counts.services} услуг`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка создания копии");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload() {
    setBusy("download");
    setError(null);
    try {
      const local = loadBackupLocally();
      const next = await downloadClinicBackup(local);
      setMeta(next);
      showOk(`Файл inclinic-backup-${next.createdAt.slice(0, 10)}.json загружен`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка скачивания");
    } finally {
      setBusy(null);
    }
  }

  function handleRestorePick() {
    setError(null);
    document.getElementById("oa-backup-restore-input")?.click();
  }

  function onRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      try {
        parseBackupFile(reader.result);
        setPendingRestore(reader.result);
        setRestoreOpen(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Неверный файл");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  async function confirmRestore() {
    if (!pendingRestore) return;
    setBusy("restore");
    setError(null);
    setRestoreOpen(false);
    try {
      const backup = parseBackupFile(pendingRestore);
      const { counts } = await restoreClinicBackupFromFile(backup);
      setMeta(backupMetaFromPayload(backup));
      showOk(
        `Восстановлено: ${counts.services} услуг, ${counts.doctors} врачей, ${counts.patients} пациентов, ${counts.bookings} записей`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка восстановления");
    } finally {
      setBusy(null);
      setPendingRestore(null);
    }
  }

  const actions = [
    { id: "create" as const, icon: IArchive, label: "Создать копию", hint: "Снимок всех данных клиники", onClick: handleCreate },
    { id: "download" as const, icon: IDownload, label: "Скачать копию", hint: "JSON-файл на компьютер", onClick: handleDownload },
    { id: "restore" as const, icon: IShield, label: "Восстановить", hint: "Загрузить файл копии", onClick: handleRestorePick },
  ];

  return (
    <div className="oa-card oa-card-pad oa-backup-center">
      <SectionHeader title="Центр резервных копий" sub="Резервное копирование данных клиники" />
      {meta && (
        <p className="oa-backup-center-meta">
          Последняя копия: {new Date(meta.createdAt).toLocaleString("ru-RU")}
          {" · "}
          {meta.counts.patients} пац., {meta.counts.bookings} зап., {meta.counts.services} усл.
        </p>
      )}
      <div className="oa-backup-center-grid">
        {actions.map(({ id, icon: Icon, label, hint, onClick }) => (
          <button
            key={id}
            type="button"
            className="oa-backup-action"
            onClick={onClick}
            disabled={!!busy}
          >
            <AdminIcon3d icon={Icon} size={30} iconSize={14} />
            <div className="oa-backup-action-title">{label}</div>
            <div className="oa-backup-action-hint">{hint}</div>
            {busy === id && <span className="oa-backup-action-busy">…</span>}
          </button>
        ))}
      </div>
      <input
        id="oa-backup-restore-input"
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={onRestoreFile}
      />
      {message && <p className="oa-backup-center-msg oa-backup-center-msg--ok">{message}</p>}
      {error && <p className="oa-backup-center-msg oa-backup-center-msg--err">{error}</p>}

      <ConfirmDialog
        open={restoreOpen}
        onClose={() => { setRestoreOpen(false); setPendingRestore(null); }}
        onConfirm={() => { void confirmRestore(); }}
        title="Восстановить из копии?"
        message="Данные из файла будут объединены с текущими (услуги, врачи, пациенты, записи). Продолжить?"
        confirmLabel="Восстановить"
        danger
      />
    </div>
  );
}

function ActivityLogCard() {
  return (
    <div className="oa-card oa-card-pad oa-archive-vault-settings">
      <div className="oa-archive-vault-settings-head">
        <AdminIcon3d icon={IActivity} size={36} iconSize={16} />
        <div>
          <SectionHeader
            title="Журнал активности"
            sub="Аудит входов, изменений записей и действий администраторов"
          />
        </div>
      </div>
      <p className="oa-archive-vault-settings-note">
        Раздел не отображается в боковом меню. Откройте журнал, когда нужно проверить
        историю действий в системе.
      </p>
      <Link href="/admin/activity" className="oa-btn oa-btn-primary" style={{ textDecoration: "none", alignSelf: "flex-start" }}>
        <IActivity style={{ width: 16, height: 16 }} />
        Открыть журнал
      </Link>
    </div>
  );
}

function ArchiveVaultCard() {
  return (
    <div className="oa-card oa-card-pad oa-archive-vault-settings">
      <div className="oa-archive-vault-settings-head">
        <AdminIcon3d icon={IArchive} size={36} iconSize={16} />
        <div>
          <SectionHeader
            title="Защищённый архив"
            sub="Завершённые приёмы, доход и история — отдельный раздел с дополнительной защитой"
          />
        </div>
      </div>
      <p className="oa-archive-vault-settings-note">
        Архив не отображается в боковом меню. Откройте его, когда нужно — потребуется пароль
        входа в вашу учётную запись владельца.
      </p>
      <Link href="/admin/archive" className="oa-btn oa-btn-primary" style={{ textDecoration: "none", alignSelf: "flex-start" }}>
        <IArchive style={{ width: 16, height: 16 }} />
        Открыть архив
      </Link>
    </div>
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

function BrandUpload({
  asset, title, hint, previewVariant, previewSize = 54,
}: {
  asset: BrandAsset;
  title: string;
  hint: string;
  previewVariant: "icon" | "full";
  previewSize?: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const read = () => setUrl(getBrandAsset(asset));
    read();
    window.addEventListener("inclinic-brand-updated", read);
    return () => window.removeEventListener("inclinic-brand-updated", read);
  }, [asset]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("Выберите изображение");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMsg("Не больше 2 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBrandAsset(asset, reader.result);
        setUrl(reader.result);
        setMsg("Сохранено ✓");
        setTimeout(() => setMsg(""), 2000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const fallback = previewVariant === "full" ? "/logo-full.png" : "/logo-icon-512.png";
  const src = url ?? fallback;

  return (
    <div className="oa-brand-upload">
      <div className="oa-brand-upload-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title}
          style={previewVariant === "full"
            ? { height: 40, width: "auto", maxWidth: "100%" }
            : { width: previewSize, height: previewSize }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--oa-text-faint)", marginTop: 4, lineHeight: 1.45 }}>{hint}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <label className="oa-btn oa-btn-primary oa-btn-sm" style={{ cursor: "pointer" }}>
            Загрузить
            <input type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
          </label>
          {url && (
            <button type="button" className="oa-btn oa-btn-ghost oa-btn-sm" onClick={() => { clearBrandAsset(asset); setUrl(null); setMsg("Удалено"); setTimeout(() => setMsg(""), 2000); }}>
              Сбросить
            </button>
          )}
        </div>
        {msg && <div style={{ fontSize: 12, color: "var(--oa-success)", marginTop: 6, fontWeight: 600 }}>{msg}</div>}
      </div>
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
