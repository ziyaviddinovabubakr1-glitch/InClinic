"use client";

import { useState } from "react";
import AdminBrandLogo from "@/components/admin/AdminBrandLogo";
import { SectionHeader } from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import { IContent } from "@/components/admin/icons";

const TABS = [
  {
    id: "contacts",
    label: "Контакты",
    hint: "Телефон, email и адрес на странице «Контакты» и в подвале сайта. После изменения нажмите «Сохранить».",
  },
  {
    id: "hero",
    label: "Главная",
    hint: "Текст на главной странице: слоган и блок «О клинике». Логотип настраивается в Настройках.",
  },
  {
    id: "social",
    label: "Соцсети",
    hint: "Ссылки на Telegram и Instagram — отображаются иконками в шапке и подвале сайта.",
  },
  {
    id: "promo",
    label: "Акции",
    hint: "Баннер акции на главной: заголовок и короткий текст. Можно отключить, очистив поля.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ContentPage() {
  const [tab, setTab] = useState<TabId>("contacts");
  const [phone, setPhone] = useState(process.env.NEXT_PUBLIC_CLINIC_PHONE ?? "+992 90 000-00-00");
  const [email, setEmail] = useState("info@inclinic.tj");
  const [address, setAddress] = useState("г. Душанбе, Таджикистан");
  const [tagline, setTagline] = useState("Медицина нового поколения");
  const [about, setAbout] = useState("Современная клиника с заботой о каждом пациенте.");
  const [telegram, setTelegram] = useState("https://t.me/");
  const [instagram, setInstagram] = useState("https://instagram.com/");
  const [promoTitle, setPromoTitle] = useState("Скидка 15% на первый приём");
  const [promoText, setPromoText] = useState("Действует до конца месяца для новых пациентов.");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 860, margin: "0 auto", width: "100%" }}>
      <div className="oa-card oa-card-pad">
        <SectionHeader title="Контент сайта" sub="Редактируйте тексты и контакты для публичного сайта" />

        <div className="oa-chips" style={{ marginBottom: 14 }}>
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`oa-chip ${tab === t.id ? "oa-chip-active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "contacts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Телефон на сайте" value={phone} onChange={setPhone} />
            <Field label="Email на сайте" value={email} onChange={setEmail} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Адрес клиники" value={address} onChange={setAddress} />
            </div>
          </div>
        )}

        {tab === "hero" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 14, background: "var(--oa-surface-2)", borderRadius: 12, border: "1px solid var(--oa-border)" }}>
              <AdminBrandLogo variant="full" size="md" context="site" />
              <div style={{ fontSize: 12.5, color: "var(--oa-text-soft)" }}>Так логотип выглядит на главной (меняется в Настройках)</div>
            </div>
            <Field label="Слоган на главной" value={tagline} onChange={setTagline} />
            <div>
              <label className="oa-label">Текст «О клинике»</label>
              <textarea className="oa-textarea" rows={4} value={about} onChange={(e) => setAbout(e.target.value)} />
            </div>
          </div>
        )}

        {tab === "social" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Ссылка Telegram" value={telegram} onChange={setTelegram} />
            <Field label="Ссылка Instagram" value={instagram} onChange={setInstagram} />
          </div>
        )}

        {tab === "promo" && (
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Заголовок акции" value={promoTitle} onChange={setPromoTitle} />
            <div>
              <label className="oa-label">Текст акции</label>
              <textarea className="oa-textarea" rows={3} value={promoText} onChange={(e) => setPromoText(e.target.value)} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20 }}>
          <button type="button" className="oa-btn oa-btn-primary" onClick={save}>
            <IContent style={{ width: 16, height: 16 }} />
            Сохранить изменения
          </button>
          {saved && <span style={{ fontSize: 13, color: "var(--oa-success)", fontWeight: 600 }}>Сохранено ✓</span>}
        </div>
      </div>
    </MotionPage>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="oa-label">{label}</label>
      <input className="oa-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
