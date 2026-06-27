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
    const user = username.trim();
    const pass = password.trim();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: user, password: pass }),
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
            <div className="oa-login-logo-neon-wrap">
              <div className="oa-login-logo-glow-top" aria-hidden>
                <div className="oa-login-logo-glow-spin" />
              </div>
              <div className="oa-login-logo-mask">
                <AdminBrandLogo
                  variant="icon"
                  size="hero"
                  animate
                  className="oa-login-logo-img"
                />
              </div>
            </div>
          </div>

          <div className="oa-login-card-frame">
            <div className="oa-login-card-backglow" aria-hidden>
              <div className="oa-login-card-backglow-spin" />
            </div>
            <div className="oa-login-card-halo" aria-hidden />
            <div className="oa-login-card">
              <form onSubmit={handleLogin} className="oa-login-form">
                <div className="oa-login-field">
                  <label className="oa-login-label" htmlFor="oa-login-user">
                    Имя пользователя
                  </label>
                  <div className="oa-login-input-wrap">
                    <input
                      id="oa-login-user"
                      className="oa-login-input"
                      value={username}
                      onChange={(e) => onCredentialsChange(setUsername, e.target.value)}
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="oa-login-field">
                  <label className="oa-login-label" htmlFor="oa-login-pass">
                    Пароль
                  </label>
                  <div className="oa-login-input-wrap">
                    <input
                      id="oa-login-pass"
                      className="oa-login-input"
                      type="password"
                      value={password}
                      onChange={(e) => onCredentialsChange(setPassword, e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
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
