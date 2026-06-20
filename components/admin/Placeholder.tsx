"use client";

import type { ReactNode, SVGProps } from "react";
import { MotionPage } from "@/components/admin/motion";

/**
 * Premium "coming soon" screen for modules whose architecture exists in the
 * service layer but whose full UI ships in a later release.
 */
export default function Placeholder({
  icon: Icon, title, description, features,
}: {
  icon: (p: SVGProps<SVGSVGElement>) => JSX.Element;
  title: string;
  description: string;
  features: { label: string; ready?: boolean }[];
}) {
  return (
    <MotionPage>
    <div className="oa-card oa-card-pad" style={{ padding: 40, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="oa-kpi-icon oa-tone-blue" style={{ width: 52, height: 52, borderRadius: 15, margin: 0 }}>
          <Icon style={{ width: 26, height: 26 }} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</h2>
            <span className="oa-soon-pill">Скоро</span>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--oa-text-soft)", marginTop: 4, maxWidth: 460, lineHeight: 1.5 }}>{description}</p>
        </div>
      </div>

      <hr className="oa-divider" style={{ margin: "24px 0" }} />

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--oa-text-faint)", marginBottom: 12 }}>
        Что появится в этом модуле
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "var(--oa-surface-2)", border: "1px solid var(--oa-border)", borderRadius: 11 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: f.ready ? "var(--oa-success)" : "var(--oa-border-strong)",
            }} />
            <span style={{ fontSize: 13, color: "var(--oa-text)" }}>{f.label}</span>
            {f.ready && <span className="oa-badge oa-badge-completed" style={{ marginLeft: "auto", fontSize: 10 }}>готово</span>}
          </div>
        ))}
      </div>
    </div>
    </MotionPage>
  );
}

export function PlaceholderWrap({ children }: { children: ReactNode }) {
  return <div className="oa-fade-up">{children}</div>;
}
