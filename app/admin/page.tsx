"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IShield } from "@/components/admin/icons";
import { MotionPage } from "@/components/admin/motion";
import AdminBrandLogo from "@/components/admin/AdminBrandLogo";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Ошибка авторизации");
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="oa-login-shell">
      <MotionPage style={{ width: "100%", maxWidth: 410 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26 }}>
          <AdminBrandLogo variant="full" size="lg" animate />
          <p className="oa-login-subtitle">Панель управления клиникой</p>
        </div>

        <div className="oa-login-card">
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <div>
              <label className="oa-label">Имя пользователя</label>
              <input
                className="oa-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="oa-label">Пароль</label>
              <input
                className="oa-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="oa-badge oa-badge-cancelled" style={{ padding: "9px 13px", borderRadius: 10, fontSize: 12.5 }}>
                {error}
              </div>
            )}

            <button type="submit" className="oa-btn oa-btn-gold" disabled={loading} style={{ padding: "12px", marginTop: 4, width: "100%" }}>
              {loading ? "Вход..." : "Войти в панель"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, color: "var(--oa-text-faint)", fontSize: 11.5 }}>
            <IShield style={{ width: 15, height: 15 }} />
            <span>Защищённый доступ · только роль OWNER</span>
          </div>
        </div>
      </MotionPage>
    </main>
  );
}
