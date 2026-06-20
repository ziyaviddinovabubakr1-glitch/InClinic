"use client";

import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n";

interface Props {
  compact?: boolean;
  className?: string;
}

export default function ThemeSwitcher({ compact = false, className = "" }: Props) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`theme-toggle-btn p-2 rounded-xl transition-all duration-200 ${className}`}
        aria-label={t.themeLabel}
        title={theme === "dark" ? t.themeLight : t.themeDark}
      >
        {theme === "dark" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div
      className={`theme-switcher relative flex rounded-xl p-1 ${className}`}
      role="group"
      aria-label={t.themeLabel}
    >
      <div
        className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out pointer-events-none theme-switcher-pill"
        style={{
          width: "calc(50% - 4px)",
          left: theme === "dark" ? "4px" : "calc(50% + 0px)",
        }}
      />

      {(["dark", "light"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setTheme(mode)}
          className={`
            relative z-10 flex-1 py-2.5 px-3 rounded-lg
            transition-colors duration-200 flex items-center justify-center
            ${theme === mode ? "theme-switcher-active" : "theme-switcher-inactive"}
          `}
          aria-label={mode === "dark" ? t.themeDark : t.themeLight}
          title={mode === "dark" ? t.themeDark : t.themeLight}
        >
          {mode === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
