"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import ThemeSwitcher from "./ThemeSwitcher";
import BrandLogo from "./BrandLogo";
import { useLanguage } from "@/lib/i18n";
import { useSplash } from "@/lib/splash";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const { active: splashActive } = useSplash();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (pathname?.startsWith("/admin")) return <>{children}</>;

  return (
    <div className={`app-shell-root flex h-screen overflow-hidden ${splashActive ? "app-shell-hidden" : ""}`}>

      <div
        className={`
          fixed inset-0 z-40 bg-black/20 backdrop-blur-sm
          transition-opacity duration-300 md:hidden
          ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          w-64 h-screen flex-shrink-0
          transition-transform duration-300 ease-out md:transition-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 h-screen overflow-y-auto overflow-x-hidden min-w-0 relative flex flex-col">

        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b theme-border-b theme-surface-bar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-theme-muted theme-nav-link transition-colors"
            aria-label={t.openMenu}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <BrandLogo size="xs" showGlow className="flex-shrink-0 scale-[0.72] origin-left" />
          <span className="neon-title text-base flex-1 sidebar-neon-brand">
            <span className="brand-in font-extrabold">In</span>
            <span className="brand-clinic font-extrabold">Clinic</span>
          </span>
          <ThemeSwitcher compact />
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
