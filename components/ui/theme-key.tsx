"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";
import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n";
import "./theme-key.css";

interface ThemeKeyProps {
  compact?: boolean;
  className?: string;
}

/** Skeuomorphic light/dark theme toggle (clinic site only). */
export function ThemeKey({ compact = false, className }: ThemeKeyProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const inputId = useId().replace(/:/g, "");
  const isLight = theme === "light";

  return (
    <div
      className={cn("theme-key-root", compact && "theme-key-root--compact", className)}
      title={isLight ? t.themeDark : t.themeLight}
    >
      <label htmlFor={inputId} className="theme-key-wrap">
        <input
          id={inputId}
          type="checkbox"
          checked={isLight}
          onChange={(e) => setTheme(e.target.checked ? "light" : "dark")}
          aria-label={t.themeLabel}
        />
        <button type="button" className="theme-key-button" tabIndex={-1} aria-hidden>
          <div className="theme-key-corner" />
          <div className="theme-key-inner">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden>
              {/* Moon — dark theme */}
              <path
                className="theme-key-symbol theme-key-symbol--moon"
                d="M44 38.5a18 18 0 0 1-24.2-24.2A18 18 0 1 0 44 38.5Z"
              />
              {/* Sun — light theme */}
              <circle className="theme-key-symbol theme-key-symbol--sun" cx="32" cy="32" r="11" />
              <g className="theme-key-path-glow">
                <path d="M32 8v8M32 48v8M8 32h8M48 32h8M14.6 14.6l5.6 5.6M43.8 43.8l5.6 5.6M14.6 49.4l5.6-5.6M43.8 20.2l5.6-5.6" />
              </g>
              <g className="theme-key-path">
                <path d="M32 8v8M32 48v8M8 32h8M48 32h8M14.6 14.6l5.6 5.6M43.8 43.8l5.6 5.6M14.6 49.4l5.6-5.6M43.8 20.2l5.6-5.6" />
              </g>
            </svg>
          </div>
        </button>
        <div className="theme-key-led" aria-hidden />
        <div className="theme-key-bg" aria-hidden>
          <div className="theme-key-shine-1" />
          <div className="theme-key-shine-2" />
        </div>
        <div className="theme-key-bg-glow" aria-hidden />
      </label>
    </div>
  );
}
