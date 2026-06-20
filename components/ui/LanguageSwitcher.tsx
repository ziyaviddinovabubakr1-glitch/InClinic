"use client";

import { useLanguage, type Lang } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();

  function select(l: Lang) {
    if (l !== lang) setLang(l);
  }

  return (
    <div
      className="lang-switcher relative flex rounded-xl p-1 mx-3"
      role="group"
      aria-label={t.langLabel}
    >
      <div
        className="lang-switcher-pill absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out pointer-events-none"
        style={{
          width: "calc(50% - 4px)",
          left: lang === "ru" ? "4px" : "calc(50% + 0px)",
        }}
      />

      {(["ru", "tj"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => select(l)}
          className={`
            relative z-10 flex-1 py-2 rounded-lg text-xs font-bold tracking-wider
            transition-colors duration-200
            ${lang === l ? "lang-active neon-white" : "lang-inactive"}
          `}
        >
          {l === "ru" ? "РУС" : "ТОҶ"}
        </button>
      ))}
    </div>
  );
}
