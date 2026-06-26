"use client";

import Link from "next/link";
import {
  IconShield, IconZap, IconLab, IconPhone, IconLocation, IconCalendar,
} from "@/components/ui/Icons";
import BrandLogo from "@/components/ui/BrandLogo";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLanguage } from "@/lib/i18n";

const clinicPhone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? "+992 XX XXX XX XX";

export default function HomePage() {
  const { t } = useLanguage();

  const ABOUT_LINES = [
    { Icon: IconShield, text: t.aboutLine1 },
    { Icon: IconZap,    text: t.aboutLine2 },
    { Icon: IconLab,    text: t.aboutLine3 },
  ];

  const HOURS = [
    { day: t.dayMonFri, time: "08:00 – 18:00" },
    { day: t.daySat,    time: "09:00 – 14:00" },
    { day: t.daySun,    time: t.closed },
  ];

  return (
    <div className="flex flex-col px-3 sm:px-4 py-4 sm:py-5 md:py-6 site-page">

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full">
        <AnimatedSection animate className="center-frost-panel w-full px-4 py-6 sm:px-6 sm:py-8">

        <div className="mb-4">
          <BrandLogo size="sm" />
        </div>

        <h1
          className="neon-title mb-2 text-theme"
          style={{ fontSize: "clamp(1.65rem, 4vw, 2.35rem)" }}
        >
          <span className="brand-in font-bold">In</span>
          <span className="brand-clinic font-bold">Clinic</span>
        </h1>
        <p className="text-theme-muted mb-10 md:mb-14 tracking-wide text-sm md:text-base">
          {t.tagline}
        </p>

        <div className="w-full mb-10 md:mb-14 space-y-6">
          <h2 className="neon-subtitle text-theme-muted mb-2">
            {t.aboutTitle}
          </h2>
          <p className="text-theme text-sm md:text-base leading-relaxed max-w-lg mx-auto">
            {t.aboutText}
          </p>
          <div className="space-y-5 mt-8 max-w-md mx-auto w-full">
            {ABOUT_LINES.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-4 text-left">
                <div className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center theme-icon-box">
                  <Icon size={20} />
                </div>
                <p className="text-theme text-sm md:text-base leading-relaxed flex-1">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Link href="/booking" className="btn-primary px-10 py-3.5 text-base font-semibold inline-flex items-center gap-2">
          <IconCalendar size={20} />
          {t.bookCta}
        </Link>
        </AnimatedSection>
      </div>

      <div className="pt-8 md:pt-14 pb-2 text-center max-w-xl mx-auto w-full">
        <div className="center-frost-panel px-6 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14">
        <h2 className="neon-subtitle text-theme-muted mb-8">
          {t.contactsTitle}
        </h2>

        <div className="space-y-5 mb-8">
          <a
            href={`tel:${clinicPhone.replace(/\s/g, "")}`}
            className="flex items-center justify-center gap-3 group"
          >
            <IconPhone size={22} className="text-sky-400 opacity-90" />
            <span className="text-theme text-lg font-semibold group-hover:opacity-90 transition-opacity">
              {clinicPhone}
            </span>
          </a>

          <div className="flex items-center justify-center gap-3">
            <IconLocation size={22} className="text-sky-400 opacity-90" />
            <span className="text-theme text-sm md:text-base">
              {t.address}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {HOURS.map((h) => (
            <div key={h.day} className="text-xs md:text-sm px-3 py-1.5 rounded-lg theme-pill">
              <span className="text-theme font-medium">{h.day}</span>
              <span className="mx-2 text-theme-faint">·</span>
              <span className={h.time === t.closed ? "text-theme-muted" : "text-theme"}>
                {h.time}
              </span>
            </div>
          ))}
        </div>
        </div>
      </div>

    </div>
  );
}
