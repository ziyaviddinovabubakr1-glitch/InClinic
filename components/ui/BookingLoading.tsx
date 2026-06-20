"use client";

import { useLanguage } from "@/lib/i18n";

export default function BookingLoading() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
        <p className="text-theme-muted text-sm">{t.loadingPage}</p>
      </div>
    </div>
  );
}
