"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import OwnerSessionGuard from "./OwnerSessionGuard";
import AdminBrandLogo from "./AdminBrandLogo";
import {
  IDashboard, IAnalytics, IDoctors, IPatients, IAppointments, IServices,
  IReviews, IArchive, IReports, IExports, IContent, INotifications, ISettings,
  ILogout, IMenu, IClose, IPlus,
} from "./icons";
import { OWNER_NAME, OWNER_TITLE } from "@/lib/admin/owner";
import AdminNotifyDropdown from "./AdminNotifyDropdown";
import OwnerAvatar from "./OwnerAvatar";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

function formatDate(): string {
  return new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

interface NavItem {
  href: string;
  label: string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element;
}

const NAV_MAIN: NavItem[] = [
  { href: "/admin/dashboard", label: "Дашборд", Icon: IDashboard },
  { href: "/admin/analytics", label: "Аналитика", Icon: IAnalytics },
];
const NAV_MANAGE: NavItem[] = [
  { href: "/admin/doctors", label: "Врачи", Icon: IDoctors },
  { href: "/admin/patients", label: "Пациенты", Icon: IPatients },
  { href: "/admin/appointments", label: "Записи", Icon: IAppointments },
  { href: "/admin/services", label: "Услуги", Icon: IServices },
  { href: "/admin/reviews", label: "Отзывы", Icon: IReviews },
];
const NAV_DATA: NavItem[] = [
  { href: "/admin/archive", label: "Архив", Icon: IArchive },
  { href: "/admin/reports", label: "Отчёты", Icon: IReports },
  { href: "/admin/exports", label: "Экспорт", Icon: IExports },
];
const NAV_SYSTEM: NavItem[] = [
  { href: "/admin/content", label: "Контент", Icon: IContent },
  { href: "/admin/notifications", label: "Уведомления", Icon: INotifications },
  { href: "/admin/settings", label: "Настройки", Icon: ISettings },
];

function NavSection({
  label, items, pathname, onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <div className="oa-nav-group-label">{label}</div>
      {items.map(({ href, label: l, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`oa-nav-item ${active ? "oa-nav-item-active" : ""}`}
          >
            <span className="oa-nav-icon-wrap"><Icon /></span>
            <span className="oa-nav-label">{l}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE", credentials: "include" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="oa-shell">
      <div
        className={`oa-sidebar-overlay ${open ? "oa-sidebar-overlay-show" : ""}`}
        onClick={() => setOpen(false)}
      />

      <aside className={`oa-sidebar ${open ? "oa-sidebar-open" : ""}`}>
        <Link href="/admin/dashboard" className="oa-sidebar-brand" style={{ textDecoration: "none", color: "inherit" }}>
          <AdminBrandLogo size="sm" />
          <div style={{ flex: 1 }}>
            <div className="oa-brand-title">
              In<span className="oa-brand-title-gold">Clinic</span>
            </div>
            <div className="oa-brand-sub">Owner Panel</div>
          </div>
          <button
            className="oa-btn oa-btn-icon oa-btn-ghost oa-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
          >
            <IClose />
          </button>
        </Link>

        <nav className="oa-nav">
          <NavSection label="Обзор" items={NAV_MAIN} pathname={pathname} onNavigate={() => setOpen(false)} />
          <NavSection label="Управление" items={NAV_MANAGE} pathname={pathname} onNavigate={() => setOpen(false)} />
          <NavSection label="Данные" items={NAV_DATA} pathname={pathname} onNavigate={() => setOpen(false)} />
          <NavSection label="Система" items={NAV_SYSTEM} pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>

        <div className="oa-sidebar-footer">
          <div className="oa-sidebar-owner">
            <OwnerAvatar size={40} />
            <div>
              <div className="oa-sidebar-owner-name">{OWNER_TITLE}</div>
              <div className="oa-sidebar-owner-role">{OWNER_NAME}</div>
            </div>
          </div>
          <button
            className="oa-nav-item"
            style={{ width: "100%", marginTop: 8, background: "transparent" }}
            onClick={handleLogout}
          >
            <ILogout />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <div className="oa-main">
        <header className="oa-topbar">
          <button className="oa-burger" onClick={() => setOpen(true)} aria-label="Меню">
            <IMenu />
          </button>
          <Link href="/admin/dashboard" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <AdminBrandLogo size="sm" className="oa-topbar-logo" />
          </Link>
          <div className="oa-topbar-greeting">
            <div className="oa-topbar-greeting-title">
              {greeting()}, <span>{OWNER_NAME}</span>
            </div>
            <div className="oa-topbar-greeting-date">{formatDate()}</div>
          </div>
          <div className="oa-topbar-spacer" />
          <div className="oa-topbar-actions">
            <Link href="/admin/appointments" className="oa-btn oa-btn-gold oa-btn-sm" style={{ textDecoration: "none" }}>
              <IPlus style={{ width: 16, height: 16 }} />
              <span className="oa-btn-text-sm-hide">Новая запись</span>
            </Link>
            <AdminNotifyDropdown />
            <span className="oa-owner-badge">
              <span className="oa-badge-dot" /> {OWNER_NAME}
            </span>
            <OwnerAvatar size={40} />
          </div>
        </header>

        <main className="oa-content">{children}</main>
      </div>

      <OwnerSessionGuard />
    </div>
  );
}
