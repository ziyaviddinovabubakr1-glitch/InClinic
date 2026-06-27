"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle, Lock, Shield } from "lucide-react";
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
        <div className="oa-login-glass-wrap">
          <div className="oa-login-glass-aura" aria-hidden />
          <div className="oa-login-glass-neon" aria-hidden>
            <div className="oa-login-glass-neon-beam" />
          </div>

          <div className="oa-login-glass-panel">
            <div className="oa-login-logo-crest">
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

            <form onSubmit={handleLogin} className="oa-login-form">
              <div className="oa-login-input-wrap">
                <input
                  id="oa-login-user"
                  className="oa-login-input"
                  value={username}
                  onChange={(e) => onCredentialsChange(setUsername, e.target.value)}
                  autoComplete="username"
                  aria-label="Имя пользователя"
                  autoFocus
                />
                <UserCircle className="oa-login-input-icon" size={20} aria-hidden />
              </div>

              <div className="oa-login-input-wrap">
                <input
                  id="oa-login-pass"
                  className="oa-login-input"
                  type="password"
                  value={password}
                  onChange={(e) => onCredentialsChange(setPassword, e.target.value)}
                  autoComplete="current-password"
                  aria-label="Пароль"
                />
                <Lock className="oa-login-input-icon" size={20} aria-hidden />
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
              <Shield size={14} aria-hidden />
              <span>Защищённый доступ · только роль OWNER</span>
            </div>
          </div>
        </div>
      </MotionPage>
    </main>
  );
}
