"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconCalendar, IconTelegram } from "@/components/ui/Icons";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import BrandLogo from "@/components/ui/BrandLogo";
import { useLanguage } from "@/lib/i18n";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const NAV_MAIN = [
    { href: "/",        label: t.home,    Icon: IconHome,     exact: true },
    { href: "/booking", label: t.booking, Icon: IconCalendar },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname?.startsWith(href) ?? false;
  }

  return (
    <aside className="theme-sidebar sidebar-neon h-full flex flex-col">
      <div className="px-4 py-5 border-b theme-border-b sidebar-neon-header">
        <div className="flex items-start gap-3.5">
          <BrandLogo size="xs" showGlow className="flex-shrink-0" />
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="neon-title text-lg leading-tight sidebar-neon-brand">
              <span className="brand-in font-extrabold">In</span>
              <span className="brand-clinic font-extrabold">Clinic</span>
            </div>
            <p className="neon-subtitle neon-blue text-[11px] leading-snug tracking-[0.11em] mt-2 whitespace-normal">
              {t.tagline}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <ThemeSwitcher compact />
            {onClose && (
              <button
                onClick={onClose}
                className="theme-toggle-btn p-1.5 rounded-lg md:hidden"
                aria-label={t.closeMenu}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="neon-subtitle neon-blue px-2 mb-3 tracking-widest opacity-80">
          {t.nav}
        </div>
        <nav className="space-y-1">
          {NAV_MAIN.map((item) => {
            const active = isActive(item.href, item.exact);
            const { Icon } = item;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  sidebar-nav-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm
                  transition-all duration-200
                  ${active ? "sidebar-nav-active font-semibold" : "theme-nav-link"}
                `}
              >
                <Icon size={20} />
                <span className="flex-1">{item.label}</span>
                {active && <span className="sidebar-nav-dot w-1.5 h-1.5 rounded-full flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-0 py-4 border-t theme-border-b space-y-3">
        <LanguageSwitcher />

        <div className="px-3 space-y-1">
          <a
            href="https://t.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm theme-nav-link transition-colors"
          >
            <IconTelegram size={20} />
            <span>{t.telegram}</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
