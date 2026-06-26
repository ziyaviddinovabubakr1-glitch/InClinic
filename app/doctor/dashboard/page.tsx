"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctor, getDoctorAnalytics, money } from "@/lib/admin/services";
import type { Doctor, DoctorAnalytics } from "@/lib/admin/types";
import { getDoctorSession, clearDoctorSession } from "@/lib/doctor-session";
import { AreaChart } from "@/components/admin/charts";

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [analytics, setAnalytics] = useState<DoctorAnalytics | null>(null);

  useEffect(() => {
    const session = getDoctorSession();
    if (!session) {
      router.replace("/doctor");
      return;
    }
    getDoctor(session.doctorId).then((d) => {
      if (!d) {
        clearDoctorSession();
        router.replace("/doctor");
        return;
      }
      setDoctor(d);
      getDoctorAnalytics(d.id).then(setAnalytics);
    });
  }, [router]);

  function logout() {
    clearDoctorSession();
    router.push("/doctor");
  }

  if (!doctor) {
    return (
      <div className="doctor-login-page">
        <div className="doctor-login-card"><p style={{ textAlign: "center", opacity: 0.7 }}>Загрузка…</p></div>
      </div>
    );
  }

  return (
    <div className="doctor-dash">
      <header className="doctor-dash-head">
        <div>
          <p className="doctor-dash-eyebrow">Кабинет врача</p>
          <h1>{doctor.fullName}</h1>
          <p>{doctor.specialty} · {doctor.experienceYears} лет</p>
        </div>
        <div className="doctor-dash-actions">
          <Link href="/" className="doctor-btn doctor-btn-ghost">Сайт</Link>
          <button type="button" className="doctor-btn doctor-btn-ghost" onClick={logout}>Выйти</button>
        </div>
      </header>

      <div className="doctor-dash-grid">
        <Stat label="Пациенты" value={String(doctor.patientsCount)} />
        <Stat label="Приёмы" value={String(doctor.appointmentsCount)} />
        <Stat label="Доход" value={money(doctor.revenueGenerated)} />
        <Stat label="Рейтинг" value={doctor.rating.toFixed(1)} />
      </div>

      {analytics && (
        <div className="doctor-dash-chart">
          <h2>Доход по месяцам</h2>
          <AreaChart data={analytics.performance} height={160} color="#3b82f6" />
        </div>
      )}

      <div className="doctor-dash-info">
        <h2>Расписание</h2>
        <p>
          {doctor.workSchedule.start} — {doctor.workSchedule.end},
          {" "}{doctor.workSchedule.days.length} дн. в неделю
        </p>
        <p style={{ marginTop: 8, opacity: 0.75 }}>Телефон для входа: {doctor.phone}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="doctor-stat">
      <span className="doctor-stat-label">{label}</span>
      <span className="doctor-stat-value">{value}</span>
    </div>
  );
}
