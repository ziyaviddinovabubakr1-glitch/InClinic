import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";

export const metadata = { title: "Контакты" };

const clinicPhone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? "+992 XX XXX XX XX";

const HOURS = [
  { day: "Понедельник – Пятница", time: "08:00 – 18:00" },
  { day: "Суббота", time: "09:00 – 14:00" },
  { day: "Воскресенье", time: "Выходной" },
];

export default function ContactsPage() {
  return (
    <div className="min-h-screen page-pad site-page">
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">

        <AnimatedSection animate>
          <div className="center-frost-panel px-6 py-10 md:px-10 md:py-12">
            <p className="neon-subtitle text-theme-muted mb-4">Связь с нами</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-theme">Контакты</h1>
            <p className="text-theme-muted mt-3">Мы всегда готовы ответить на ваши вопросы</p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          <div className="center-frost-panel p-6 md:p-7">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 theme-icon-box">📞</div>
            <h3 className="font-semibold text-theme mb-2">Телефон</h3>
            <a
              href={`tel:${clinicPhone.replace(/\s/g, "")}`}
              className="text-theme font-medium text-sm hover:opacity-90 transition-opacity"
            >
              {clinicPhone}
            </a>
            <p className="text-theme-faint text-xs mt-2">Пн–Пт 08:00–18:00</p>
          </div>

          <div className="center-frost-panel p-6 md:p-7">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 theme-icon-box">📍</div>
            <h3 className="font-semibold text-theme mb-2">Адрес</h3>
            <p className="text-theme text-sm">г. Душанбе</p>
            <p className="text-theme-muted text-xs mt-1">Таджикистан</p>
          </div>

          <div className="center-frost-panel p-6 md:p-7">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 theme-icon-box">💬</div>
            <h3 className="font-semibold text-theme mb-2">Telegram</h3>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-theme font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Написать в чат
            </a>
            <p className="text-theme-faint text-xs mt-2">Ответим быстро</p>
          </div>
        </div>

        <div className="center-frost-panel p-6 md:p-8">
          <h2 className="font-semibold text-theme mb-6">Режим работы</h2>
          <div className="space-y-3">
            {HOURS.map((h) => (
              <div
                key={h.day}
                className="flex items-center justify-between py-3 px-4 rounded-xl theme-pill"
              >
                <span className="text-theme text-sm">{h.day}</span>
                <span className={`text-sm font-medium ${h.time === "Выходной" ? "text-theme-muted" : "text-theme"}`}>
                  {h.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl p-7 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-5"
          style={{ background: "linear-gradient(135deg,#0284c7,#0ea5e9)" }}
        >
          <div>
            <h3 className="text-xl font-semibold text-white">Удобнее записаться онлайн</h3>
            <p className="text-sky-50 text-sm mt-2">
              Без звонков — выберите время и специалиста прямо сейчас
            </p>
          </div>
          <Link href="/booking" className="btn-white flex-shrink-0">
            Записаться онлайн →
          </Link>
        </div>

      </div>
    </div>
  );
}
