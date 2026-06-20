"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listPatients, getPatientProfile, getSegmentCounts, money,
} from "@/lib/admin/services";
import type {
  Patient, PatientProfile, PatientSegment,
} from "@/lib/admin/types";
import { Drawer } from "@/components/admin/Modal";
import {
  Avatar, SegmentBadge, StatusBadge, Stars, SkeletonRows, EmptyState,
  StatTile, Pagination,
} from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import { ISearch, IPatients, IPhone, IMail } from "@/components/admin/icons";

const SEGMENTS: (PatientSegment | "ALL")[] = ["ALL", "NEW", "REGULAR", "VIP", "INACTIVE"];
const SEG_LABEL: Record<string, string> = {
  ALL: "Все", NEW: "Новые", REGULAR: "Постоянные", VIP: "VIP", INACTIVE: "Неактивные",
};

export default function PatientsPage() {
  const [rows, setRows] = useState<Patient[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<PatientSegment | "ALL">("ALL");
  const [counts, setCounts] = useState<Record<PatientSegment, number> | null>(null);

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const pageSize = 12;

  const refresh = useCallback(() => {
    setRows(null);
    listPatients({ search, segment, page, pageSize }).then((r) => {
      setRows(r.rows);
      setTotal(r.total);
    });
  }, [search, segment, page]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  useEffect(() => { getSegmentCounts().then(setCounts); }, []);
  useEffect(() => { setPage(1); }, [search, segment]);

  async function openProfile(id: string) {
    setProfileOpen(true);
    setProfile(null);
    setProfile(await getPatientProfile(id));
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="oa-toolbar">
        <div className="oa-search" style={{ flex: 1, minWidth: 220 }}>
          <ISearch />
          <input className="oa-input" placeholder="Поиск по имени, телефону или email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="oa-chips">
          {SEGMENTS.map((s) => (
            <button key={s} className={`oa-chip ${segment === s ? "oa-chip-active" : ""}`} onClick={() => setSegment(s)}>
              {SEG_LABEL[s]}{s !== "ALL" && counts ? ` · ${counts[s as PatientSegment]}` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="oa-card oa-table-card">
        {!rows ? (
          <div className="oa-card-pad"><SkeletonRows rows={8} /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<IPatients />} title="Пациенты не найдены" sub="Измените условия поиска или фильтр." />
        ) : (
          <div className="oa-table-wrap">
            <table className="oa-table">
              <thead>
                <tr>
                  <th>Пациент</th><th>Контакты</th><th>Сегмент</th>
                  <th>Визиты</th><th>Сумма оплат</th><th>Последний визит</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => openProfile(p.id)}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={p.fullName} size={36} tone="violet" />
                        <span className="oa-cell-strong">{p.fullName}</span>
                      </div>
                    </td>
                    <td className="oa-cell-soft" style={{ fontSize: 12.5 }}>{p.phone}<br />{p.email}</td>
                    <td><SegmentBadge segment={p.segment} /></td>
                    <td className="oa-cell-strong">{p.visitsCount}</td>
                    <td className="oa-cell-strong">{money(p.totalPaid)}</td>
                    <td className="oa-cell-soft">{p.lastVisitAt ? new Date(p.lastVisitAt).toLocaleDateString("ru-RU") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />

      <Drawer open={profileOpen} onClose={() => { setProfileOpen(false); setProfile(null); }}
        title={profile?.fullName ?? "Профиль пациента"} sub={profile ? SEG_LABEL[profile.segment] : ""}>
        {!profile ? <SkeletonRows rows={6} /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span className="oa-badge oa-badge-neutral"><IPhone style={{ width: 13, height: 13 }} /> {profile.phone}</span>
              <span className="oa-badge oa-badge-neutral"><IMail style={{ width: 13, height: 13 }} /> {profile.email}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <StatTile label="Визитов" value={String(profile.visitsCount)} large />
              <StatTile label="Оплачено" value={money(profile.totalPaid)} large />
              <StatTile label="Отзывов" value={String(profile.reviewsCount)} large />
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>История записей</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {profile.appointments.slice(0, 8).map((a) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 12px", background: "var(--oa-surface-2)", borderRadius: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.serviceName}</div>
                      <div style={{ fontSize: 11.5, color: "var(--oa-text-faint)" }}>{a.doctorName} · {a.date}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
                {profile.appointments.length === 0 && <span style={{ fontSize: 12.5, color: "var(--oa-text-faint)" }}>Нет записей</span>}
              </div>
            </div>

            {profile.reviews.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Отзывы</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {profile.reviews.map((r) => (
                    <div key={r.id} style={{ padding: "10px 12px", background: "var(--oa-surface-2)", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{r.doctorName}</span>
                        <Stars rating={r.rating} size={12} />
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--oa-text-soft)", marginTop: 3 }}>{r.comment}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </MotionPage>
  );
}
