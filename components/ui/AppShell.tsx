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
    <div className={`app-shell-root flex overflow-hidden ${splashActive ? "app-shell-hidden" : ""}`}>

      <div
        className={`
          fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]
          transition-opacity duration-300 md:hidden
          ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          w-[min(18rem,88vw)] flex-shrink-0 app-shell-sidebar
          transition-transform duration-300 ease-out md:transition-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 min-h-0 min-w-0 relative flex flex-col">

        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b theme-border-b mobile-top-bar">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn"
            aria-label={t.openMenu}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <BrandLogo size="xs" className="flex-shrink-0 scale-[0.68] origin-left" />
          <span className="neon-title text-base flex-1 sidebar-neon-brand truncate">
            <span className="brand-in font-extrabold">In</span>
            <span className="brand-clinic font-extrabold">Clinic</span>
          </span>
          <ThemeSwitcher compact />
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden app-main-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
