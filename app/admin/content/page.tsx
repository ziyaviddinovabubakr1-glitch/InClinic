"use client";

import { useState } from "react";
import AdminBrandLogo from "@/components/admin/AdminBrandLogo";
import { SectionHeader } from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import { IContent } from "@/components/admin/icons";

const TABS = [
  { id: "contacts", label: "Контакты" },
  { id: "hero", label: "Главная" },
  { id: "social", label: "Соцсети" },
  { id: "promo", label: "Акции" },
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
        <SectionHeader
          title="Управление контентом"
          sub="Редактирование публичного сайта без кода"
          action={<span className="oa-badge oa-badge-confirmed"><span className="oa-badge-dot" /> UI готов</span>}
        />
        <div className="oa-chips" style={{ marginBottom: 18 }}>
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`oa-chip ${tab === t.id ? "oa-chip-active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "contacts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Телефон" value={phone} onChange={setPhone} />
            <Field label="Email" value={email} onChange={setEmail} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Адрес" value={address} onChange={setAddress} />
            </div>
          </div>
        )}

        {tab === "hero" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: "var(--oa-surface-2)", borderRadius: 14, border: "1px solid var(--oa-border)" }}>
              <AdminBrandLogo variant="full" size="md" />
              <div style={{ fontSize: 12.5, color: "var(--oa-text-soft)" }}>Логотип и бренд на главной странице</div>
            </div>
            <Field label="Слоган" value={tagline} onChange={setTagline} />
            <div>
              <label className="oa-label">О клинике</label>
              <textarea className="oa-textarea" rows={4} value={about} onChange={(e) => setAbout(e.target.value)} />
            </div>
          </div>
        )}

        {tab === "social" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Telegram" value={telegram} onChange={setTelegram} />
            <Field label="Instagram" value={instagram} onChange={setInstagram} />
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
