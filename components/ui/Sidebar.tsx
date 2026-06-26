"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconCalendar, IconClipboard } from "@/components/ui/Icons";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import BrandLogo from "@/components/ui/BrandLogo";
import { useLanguage } from "@/lib/i18n";
import { useUpcomingReceiptCount } from "@/components/patient/PatientRecordsPage";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const upcomingCount = useUpcomingReceiptCount();

  const NAV_MAIN = [
    { href: "/",        label: t.home,       Icon: IconHome,      exact: true },
    { href: "/booking", label: t.booking,    Icon: IconCalendar },
    { href: "/my",      label: t.myRecords,  Icon: IconClipboard, badge: upcomingCount },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname?.startsWith(href) ?? false;
  }

  return (
    <aside className="theme-sidebar sidebar-neon h-full flex flex-col">
      <div className="px-2.5 py-2 border-b theme-border-b sidebar-neon-header">
        <div className="flex items-start gap-2">
          <BrandLogo size="xs" className="flex-shrink-0" />
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="neon-title text-sm leading-tight sidebar-neon-brand">
              <span className="brand-in font-extrabold">In</span>
              <span className="brand-clinic font-extrabold">Clinic</span>
            </div>
            <p className="text-[9px] leading-snug text-theme-muted mt-1 whitespace-normal line-clamp-2">
              {t.tagline}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <ThemeSwitcher compact />
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="mobile-menu-btn mobile-menu-btn--compact md:hidden"
                aria-label={t.closeMenu}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-2 py-2">
        <div className="text-[8px] font-semibold uppercase tracking-widest text-theme-muted px-1.5 mb-1.5">
          {t.nav}
        </div>
        <nav className="space-y-0.5">
          {NAV_MAIN.map((item) => {
            const active = isActive(item.href, item.exact);
            const { Icon, badge } = item;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  sidebar-nav-item flex items-center gap-2 px-2 py-2 rounded-lg text-xs
                  transition-colors duration-200
                  ${active ? "sidebar-nav-active font-semibold" : "theme-nav-link"}
                `}
              >
                <Icon size={16} />
                <span className="flex-1 truncate">{item.label}</span>
                {badge != null && badge > 0 && (
                  <span className="min-w-[1.1rem] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center theme-pill text-theme-accent">
                    {badge}
                  </span>
                )}
                {active && <span className="sidebar-nav-dot w-1 h-1 rounded-full flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-0 py-2 border-t theme-border-b">
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
