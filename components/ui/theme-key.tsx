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

/** Square 3D keyboard key — clinic site theme toggle only. */
export function ThemeKey({ compact = false, className }: ThemeKeyProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const uid = useId().replace(/:/g, "");
  const inputId = `theme-key-${uid}`;
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
        <span className="theme-key-cap" aria-hidden>
          <span className="theme-key-cap-base" />
          <span className="theme-key-cap-face">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                className="theme-key-icon theme-key-icon--moon"
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g className="theme-key-icon theme-key-icon--sun">
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </span>
          <span className="theme-key-cap-led" aria-hidden />
        </span>
      </label>
    </div>
  );
}
