"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import "./admin-sidebar.css";
import OwnerSessionGuard from "./OwnerSessionGuard";
import AdminBrandLogo from "./AdminBrandLogo";
import {
  IDashboard, IAnalytics, IDoctors, IPatients, IAppointments, IServices,
  IReviews, IReports, IContent, INotifications, ISettings,
  ILogout, IMenu, IClose, IPlus,
} from "./icons";
import { OWNER_NAME, OWNER_TITLE } from "@/lib/admin/owner";
import AdminNotifyDropdown from "./AdminNotifyDropdown";
import AdminBookingAlerts from "./AdminBookingAlerts";
import OwnerAvatar from "./OwnerAvatar";
import { NavIndicator } from "./motion";
import { useAdminPermissions } from "@/components/providers/AdminPermissionsProvider";
import { permissionForAdminPage } from "@/lib/rbac";

interface NavItem {
  href: string;
  label: string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Главная",
    items: [{ href: "/admin/dashboard", label: "Обзор", Icon: IDashboard }],
  },
  {
    label: "Записи",
    items: [
      { href: "/admin/appointments", label: "Расписание", Icon: IAppointments },
      { href: "/admin/patients", label: "Пациенты", Icon: IPatients },
    ],
  },
  {
    label: "Клиника",
    items: [
      { href: "/admin/doctors", label: "Врачи", Icon: IDoctors },
      { href: "/admin/services", label: "Услуги", Icon: IServices },
      { href: "/admin/reviews", label: "Отзывы", Icon: IReviews },
    ],
  },
  {
    label: "Цифры",
    items: [
      { href: "/admin/analytics", label: "Аналитика", Icon: IAnalytics },
      { href: "/admin/reports", label: "Отчёты", Icon: IReports },
    ],
  },
  {
    label: "Сайт",
    items: [{ href: "/admin/content", label: "Страницы", Icon: IContent }],
  },
  {
    label: "Система",
    items: [
      { href: "/admin/notifications", label: "Уведомления", Icon: INotifications },
      { href: "/admin/settings", label: "Настройки", Icon: ISettings },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Обзор",
  "/admin/analytics": "Аналитика",
  "/admin/doctors": "Врачи",
  "/admin/patients": "Пациенты",
  "/admin/appointments": "Расписание",
  "/admin/services": "Услуги",
  "/admin/reviews": "Отзывы",
  "/admin/activity": "Журнал активности",
  "/admin/archive": "Архив",
  "/admin/reports": "Отчёты",
  "/admin/exports": "Экспорт",
  "/admin/content": "Страницы",
  "/admin/notifications": "Уведомления",
  "/admin/settings": "Настройки",
};

function pageTitle(pathname: string): string {
  if (/^\/admin\/doctors\/[^/]+\/analytics$/.test(pathname)) return "Аналитика врача";
  if (/^\/admin\/patients\/[^/]+$/.test(pathname)) return "Профиль пациента";
  const match = Object.keys(PAGE_TITLES).find(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  return match ? PAGE_TITLES[match] : "Панель";
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

  const title = pageTitle(pathname);
  const { can: canAction, loading: permLoading } = useAdminPermissions();

  function isItemVisible(href: string) {
    if (permLoading) return true;
    const perm = permissionForAdminPage(href);
    return !perm || canAction(perm);
  }

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isItemVisible(item.href)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="oa-shell">
      <AdminBookingAlerts />
      <div
        className={`oa-sidebar-overlay ${open ? "oa-sidebar-overlay-show" : ""}`}
        onClick={() => setOpen(false)}
      />

      <aside className={`oa-sidebar oa-sidebar-linear oa-sidebar-fill ${open ? "oa-sidebar-open" : ""}`}>
        <Link href="/admin/dashboard" className="oa-sidebar-brand" style={{ textDecoration: "none", color: "inherit" }}>
          <AdminBrandLogo size="sm" context="admin" />
          <div className="oa-sidebar-brand-text">
            <div className="oa-brand-title">
              In<span className="oa-brand-title-gold">Clinic</span>
            </div>
          </div>
          <button
            type="button"
            className="oa-btn oa-btn-icon oa-btn-ghost oa-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
          >
            <IClose />
          </button>
        </Link>

        <nav className="oa-nav oa-nav-flat oa-nav-fill oa-nav-grouped">
          {visibleGroups.map((group) => (
            <div key={group.label} className="oa-nav-group">
              <div className="oa-nav-group-label">{group.label}</div>
              {group.items.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`oa-nav-item ${active ? "oa-nav-item-active" : ""}`}
                  >
                    {active && <NavIndicator />}
                    <Icon className="oa-nav-icon-plain" style={{ width: 14, height: 14 }} />
                    <span className="oa-nav-label">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="oa-sidebar-footer">
          <div className="oa-sidebar-owner-card">
            <OwnerAvatar size={22} neonRing />
            <div className="oa-sidebar-owner-text">
              <div className="oa-sidebar-owner-name">{OWNER_NAME}</div>
              <div className="oa-sidebar-owner-role">{OWNER_TITLE}</div>
            </div>
          </div>
          <button
            type="button"
            className="oa-sidebar-logout-btn"
            onClick={handleLogout}
            aria-label="Выйти из панели"
          >
            <ILogout style={{ width: 11, height: 11 }} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <div className="oa-main">
        <header className="oa-topbar oa-topbar-linear">
          <button type="button" className="oa-burger" onClick={() => setOpen(true)} aria-label="Меню">
            <IMenu />
          </button>
          <div className="oa-topbar-title-block">
            <h1 className="oa-topbar-page-title">{title}</h1>
          </div>
          <div className="oa-topbar-spacer" />
          <div className="oa-topbar-actions">
            <Link href="/admin/appointments" className="oa-btn oa-btn-primary oa-btn-sm" style={{ textDecoration: "none" }}>
              <IPlus style={{ width: 14, height: 14 }} />
              <span className="oa-btn-text-sm-hide">Новая запись</span>
            </Link>
            <AdminNotifyDropdown />
            <OwnerAvatar size={28} />
          </div>
        </header>

        <main className="oa-content oa-content-linear">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <OwnerSessionGuard />
    </div>
  );
}
