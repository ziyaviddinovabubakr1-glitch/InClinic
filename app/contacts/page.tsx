import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";
import TiltCard from "@/components/ui/TiltCard";

export const metadata = { title: "Контакты" };

const clinicPhone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? "+992 XX XXX XX XX";

const HOURS = [
  { day: "Понедельник – Пятница", time: "08:00 – 18:00" },
  { day: "Суббота", time: "09:00 – 14:00" },
  { day: "Воскресенье", time: "Выходной" },
];

export default function ContactsPage() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        <AnimatedSection>
          <div className="center-frost-panel px-6 py-8 md:px-8 md:py-10">
            <div className="inline-flex items-center gap-2 theme-pill rounded-full px-3 py-1 text-xs font-medium mb-4">
              <span className="neon-blue">Связь с нами</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold neon-white">Контакты</h1>
            <p className="text-theme-muted mt-2">Мы всегда готовы ответить на ваши вопросы</p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={60}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TiltCard className="center-frost-panel p-6" intensity={8} glowColor="rgba(14,165,233,0.14)">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 theme-icon-box">📞</div>
              <h3 className="font-bold neon-white mb-1">Телефон</h3>
              <a
                href={`tel:${clinicPhone.replace(/\s/g, "")}`}
                className="neon-blue hover:neon-white font-medium text-sm transition-all"
              >
                {clinicPhone}
              </a>
              <p className="text-theme-faint text-xs mt-2">Пн–Пт 08:00–18:00</p>
            </TiltCard>

            <TiltCard className="center-frost-panel p-6" intensity={8} glowColor="rgba(14,165,233,0.14)">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 theme-icon-box">📍</div>
              <h3 className="font-bold neon-white mb-1">Адрес</h3>
              <p className="neon-white text-sm font-medium">г. Душанбе</p>
              <p className="text-theme-muted text-xs mt-1">Таджикистан</p>
            </TiltCard>

            <TiltCard className="center-frost-panel p-6" intensity={8} glowColor="rgba(14,165,233,0.14)">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 theme-icon-box">💬</div>
              <h3 className="font-bold neon-white mb-1">Telegram</h3>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="neon-blue hover:neon-white font-medium text-sm transition-all"
              >
                Написать в чат
              </a>
              <p className="text-theme-faint text-xs mt-2">Ответим быстро</p>
            </TiltCard>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={120}>
          <div className="center-frost-panel p-6 md:p-8">
            <h2 className="font-bold neon-white mb-5 flex items-center gap-2">
              Режим работы
            </h2>
            <div className="space-y-3">
              {HOURS.map((h) => (
                <div
                  key={h.day}
                  className="flex items-center justify-between py-3 px-3 rounded-xl theme-pill"
                >
                  <span className="neon-white text-sm font-medium">{h.day}</span>
                  <span className={`text-sm font-semibold ${h.time === "Выходной" ? "text-theme-muted" : "neon-blue"}`}>
                    {h.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={180}>
          <div
            className="rounded-2xl p-7 flex flex-col sm:flex-row items-center justify-between gap-5"
            style={{
              background: "linear-gradient(135deg,#0284c7,#0ea5e9,#06b6d4)",
              boxShadow: "0 8px 28px rgba(14,165,233,0.32)",
            }}
          >
            <div>
              <h3 className="text-xl font-bold text-white">Удобнее записаться онлайн</h3>
              <p className="text-sky-100 text-sm mt-1">
                Без звонков — выберите время и специалиста прямо сейчас
              </p>
            </div>
            <Link href="/booking" className="btn-white flex-shrink-0">
              Записаться онлайн →
            </Link>
          </div>
        </AnimatedSection>

      </div>
    </div>
  );
}
