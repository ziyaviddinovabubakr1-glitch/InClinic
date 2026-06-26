"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IShield } from "@/components/admin/icons";
import { MotionPage } from "@/components/admin/motion";
import AdminBrandLogo from "@/components/admin/AdminBrandLogo";
import RunawayLoginButton from "@/components/admin/RunawayLoginButton";
import "./admin-login.css";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isBlocked = !username.trim() || !password.trim() || !!error;

  function clearErrorOnEdit() {
    if (error) setError("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Заполните имя пользователя и пароль");
      return;
    }
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
        setError(data.error ?? "Неверный логин или пароль");
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
      <MotionPage className="oa-login-motion" style={{ width: "100%", maxWidth: 390 }}>
        <div className="oa-login-card-wrap">
          <svg className="oa-login-neon-svg" viewBox="0 0 390 420" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="oa-login-neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff8dc" />
                <stop offset="40%" stopColor="#fce588" />
                <stop offset="100%" stopColor="#c9921a" />
              </linearGradient>
            </defs>
            <rect
              className="oa-login-neon-stroke"
              x="2.5"
              y="2.5"
              width="385"
              height="415"
              rx="22"
              ry="22"
              fill="none"
              stroke="url(#oa-login-neon-grad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </svg>

          <div className="oa-login-card">
            <div className="oa-login-card-brand">
              <AdminBrandLogo variant="full" size="md" animate />
            </div>

            <form onSubmit={handleLogin} className="oa-login-form">
              <div>
                <label className="oa-label" htmlFor="oa-login-user">
                  Имя пользователя
                </label>
                <input
                  id="oa-login-user"
                  className="oa-input"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearErrorOnEdit();
                  }}
                  placeholder="Abubakr"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div>
                <label className="oa-label" htmlFor="oa-login-pass">
                  Пароль
                </label>
                <input
                  id="oa-login-pass"
                  className="oa-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearErrorOnEdit();
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="oa-login-error" role="alert">
                  {error}
                </div>
              )}

              <RunawayLoginButton
                blocked={isBlocked && !loading}
                loading={loading}
                onBlockedAttempt={() => {
                  if (!username.trim() || !password.trim()) {
                    setError("Заполните имя пользователя и пароль");
                  }
                }}
              />
            </form>

            <div className="oa-login-footer">
              <IShield style={{ width: 14, height: 14 }} aria-hidden />
              <span>Защищённый доступ · только роль OWNER</span>
            </div>
          </div>
        </div>
      </MotionPage>
    </main>
  );
}
