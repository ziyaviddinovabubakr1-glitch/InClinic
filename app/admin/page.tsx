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
  /** Only true after server confirms credentials — until then the button flees. */
  const [authOk, setAuthOk] = useState(false);

  const buttonBlocked = !authOk && !loading;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Заполните имя пользователя и пароль");
      setAuthOk(false);
      return;
    }
    setError("");
    setAuthOk(false);
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
        setAuthOk(false);
        return;
      }
      setAuthOk(true);
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setAuthOk(false);
    } finally {
      setLoading(false);
    }
  }

  function onCredentialsChange(setter: (v: string) => void, value: string) {
    setter(value);
    setAuthOk(false);
    if (error) setError("");
  }

  return (
    <main className="oa-login-shell">
      <MotionPage className="oa-login-motion" style={{ width: "100%", maxWidth: 390 }}>
        <div className="oa-login-card-wrap">
          <div className="oa-login-logo-float">
            <AdminBrandLogo variant="icon" size="lg" animate />
          </div>

          <div className="oa-login-card-frame">
            <div className="oa-login-card">
              <svg
                className="oa-login-neon-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="oa-login-neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff8dc" />
                    <stop offset="45%" stopColor="#fce588" />
                    <stop offset="100%" stopColor="#c9921a" />
                  </linearGradient>
                </defs>
                <rect
                  className="oa-login-neon-stroke"
                  x="1.2"
                  y="1.2"
                  width="97.6"
                  height="97.6"
                  rx="5.5"
                  ry="5.5"
                  pathLength="100"
                  fill="none"
                  stroke="url(#oa-login-neon-grad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <form onSubmit={handleLogin} className="oa-login-form">
                <div>
                  <label className="oa-label" htmlFor="oa-login-user">
                    Имя пользователя
                  </label>
                  <input
                    id="oa-login-user"
                    className="oa-input"
                    value={username}
                    onChange={(e) => onCredentialsChange(setUsername, e.target.value)}
                    placeholder="Логин владельца"
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
                    onChange={(e) => onCredentialsChange(setPassword, e.target.value)}
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
                  blocked={buttonBlocked}
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
        </div>
      </MotionPage>
    </main>
  );
}
