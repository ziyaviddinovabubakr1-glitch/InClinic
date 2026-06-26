"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listDoctors } from "@/lib/admin/services";
import {
  verifyDoctorCredentials,
  ensureDoctorCredentialsSeeded,
  normalizeDoctorPhone,
  getDefaultDoctorPasswordHint,
} from "@/lib/doctor-credentials";
import { getDoctorSession, setDoctorSession } from "@/lib/doctor-session";

export default function DoctorLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getDoctorSession()) router.replace("/doctor/dashboard");
  }, [router]);

  useEffect(() => {
    listDoctors().then((docs) => ensureDoctorCredentialsSeeded(docs.map((d) => d.phone)));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const doctors = await listDoctors();
      const normalized = normalizeDoctorPhone(phone);
      const doctor = doctors.find((d) => normalizeDoctorPhone(d.phone) === normalized);
      if (!doctor) {
        setError("Врач с таким телефоном не найден");
        return;
      }
      if (doctor.status === "HIDDEN") {
        setError("Аккаунт врача скрыт. Обратитесь к владельцу клиники.");
        return;
      }
      if (!verifyDoctorCredentials(phone, password)) {
        setError("Неверный пароль");
        return;
      }
      setDoctorSession({
        doctorId: doctor.id,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
      });
      router.push("/doctor/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="doctor-login-page">
      <div className="doctor-login-card">
        <div className="doctor-login-head">
          <span className="doctor-login-badge">InClinic</span>
          <h1>Кабинет врача</h1>
          <p>Вход для сотрудников клиники. Админ-панель — отдельно.</p>
        </div>

        <form onSubmit={onSubmit} className="doctor-login-form">
          <label className="doctor-label">Телефон (логин)</label>
          <input
            className="doctor-input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+992 90 100 00 01"
            required
            autoComplete="username"
          />
          <label className="doctor-label">Пароль</label>
          <input
            className="doctor-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            required
            autoComplete="current-password"
          />
          {error && <p className="doctor-error">{error}</p>}
          <button type="submit" className="doctor-btn" disabled={loading}>
            {loading ? "Вход…" : "Войти"}
          </button>
        </form>

        <p className="doctor-login-foot">
          Демо-пароль для тестовых врачей: <code>{getDefaultDoctorPasswordHint()}</code>
          <br />
          <Link href="/">← На главный сайт</Link>
        </p>
      </div>
    </div>
  );
}
