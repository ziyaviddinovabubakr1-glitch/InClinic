"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import "./admin-sidebar.css";
import OwnerSessionGuard from "./OwnerSessionGuard";
import AdminBrandLogo from "./AdminBrandLogo";
import {
  IDashboard, IAnalytics, IDoctors, IPatients, IAppointments, IServices,
  IReviews, IReports, IExports, IContent, INotifications, ISettings,
  ILogout, IMenu, IClose, IPlus, IActivity,
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

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Дашборд", Icon: IDashboard },
  { href: "/admin/analytics", label: "Аналитика", Icon: IAnalytics },
  { href: "/admin/doctors", label: "Врачи", Icon: IDoctors },
  { href: "/admin/patients", label: "Пациенты", Icon: IPatients },
  { href: "/admin/appointments", label: "Записи", Icon: IAppointments },
  { href: "/admin/services", label: "Услуги", Icon: IServices },
  { href: "/admin/reviews", label: "Отзывы", Icon: IReviews },
  { href: "/admin/activity", label: "Активность", Icon: IActivity },
  { href: "/admin/reports", label: "Отчёты", Icon: IReports },
  { href: "/admin/exports", label: "Экспорт", Icon: IExports },
  { href: "/admin/content", label: "Контент", Icon: IContent },
  { href: "/admin/notifications", label: "Уведомления", Icon: INotifications },
  { href: "/admin/settings", label: "Настройки", Icon: ISettings },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Дашборд",
  "/admin/analytics": "Аналитика",
  "/admin/doctors": "Врачи",
  "/admin/patients": "Пациенты",
  "/admin/appointments": "Записи",
  "/admin/services": "Услуги",
  "/admin/reviews": "Отзывы",
  "/admin/activity": "Журнал активности",
  "/admin/archive": "Архив",
  "/admin/reports": "Отчёты",
  "/admin/exports": "Экспорт",
  "/admin/content": "Контент",
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

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (permLoading) return true;
    const perm = permissionForAdminPage(item.href);
    return !perm || canAction(perm);
  });

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

        <nav
          className="oa-nav oa-nav-flat oa-nav-fill"
          style={{ "--oa-nav-rows": visibleNav.length } as CSSProperties}
        >
          {visibleNav.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`oa-nav-item ${active ? "oa-nav-item-active" : ""}`}
              >
                {active && <NavIndicator />}
                <span className="oa-nav-icon-wrap oa-nav-icon-3d">
                  <Icon style={{ width: 13, height: 13 }} />
                </span>
                <span className="oa-nav-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="oa-sidebar-footer">
          <div className="oa-sidebar-owner-card">
            <OwnerAvatar size={28} />
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
            <ILogout style={{ width: 13, height: 13 }} />
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
