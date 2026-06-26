"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import AdminIcon3d from "@/components/admin/AdminIcon3d";
import { SkeletonCard } from "@/components/admin/ui";
import { IArchive, ISettings } from "@/components/admin/icons";

export default function ArchiveGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "locked" | "unlocked">("loading");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/archive/access", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setState(d.unlocked ? "unlocked" : "locked");
      })
      .catch(() => {
        if (!cancelled) setState("locked");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function unlock(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/archive/access", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Неверный пароль");
        return;
      }
      setPassword("");
      setState("unlocked");
    } catch {
      setError("Не удалось проверить пароль");
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    await fetch("/api/admin/archive/access", { method: "DELETE", credentials: "include" });
    setState("locked");
    setPassword("");
  }

  if (state === "loading") {
    return (
      <div className="oa-archive-vault-screen">
        <SkeletonCard height={280} />
      </div>
    );
  }

  if (state === "locked") {
    return (
      <div className="oa-archive-vault-screen">
        <div className="oa-archive-vault-card">
          <AdminIcon3d icon={IArchive} size={40} iconSize={18} />
          <h2 className="oa-archive-vault-title">Защищённый архив</h2>
          <p className="oa-archive-vault-sub">
            Завершённые данные клиники хранятся отдельно. Для доступа введите пароль,
            которым вы входите в панель управления.
          </p>
          <form className="oa-archive-vault-form" onSubmit={unlock}>
            <label className="oa-label" htmlFor="archive-password">Пароль владельца</label>
            <input
              id="archive-password"
              className="oa-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль входа в аккаунт"
              autoComplete="current-password"
              autoFocus
            />
            {error && <p className="oa-archive-vault-error">{error}</p>}
            <button type="submit" className="oa-btn oa-btn-primary" disabled={busy || !password.trim()}>
              {busy ? "Проверка…" : "Открыть архив"}
            </button>
          </form>
          <Link href="/admin/settings" className="oa-archive-vault-back">
            <ISettings style={{ width: 14, height: 14 }} />
            Вернуться в настройки
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="oa-archive-vault-bar">
        <span className="oa-archive-vault-bar-label">Архив открыт · сессия 4 часа</span>
        <button type="button" className="oa-btn oa-btn-ghost oa-btn-sm" onClick={lock}>
          Закрыть архив
        </button>
      </div>
      {children}
    </>
  );
}
