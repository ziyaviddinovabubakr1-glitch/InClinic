import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";
import TiltCard from "@/components/ui/TiltCard";

export const metadata = { title: "О клинике" };

const VALUES = [
  { icon:"🛡️", title:"Безопасность",       desc:"Все процедуры соответствуют современным стандартам качества и безопасности" },
  { icon:"⚡", title:"Мгновенная запись",  desc:"Онлайн-запись к врачу за 60 секунд — без звонков и ожидания в очереди" },
  { icon:"🔬", title:"Точная диагностика", desc:"Современное оборудование для быстрого и точного обследования" },
  { icon:"💙", title:"Забота и комфорт",   desc:"Индивидуальный подход и внимание к каждому пациенту" },
  { icon:"🌐", title:"Онлайн-сервисы",     desc:"Личный кабинет, электронные записи и уведомления в Telegram" },
  { icon:"🏆", title:"Опытные врачи",      desc:"Команда сертифицированных специалистов с многолетним опытом" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <AnimatedSection>
          <div className="rounded-2xl p-8 text-center relative overflow-hidden"
            style={{ background:"linear-gradient(135deg,#0284c7,#0ea5e9,#06b6d4)",
              boxShadow:"0 8px 32px rgba(14,165,233,0.22)" }}>
            <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-full.png" alt="InClinic"
                style={{ height:"64px", width:"auto", margin:"0 auto 16px",
                  filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
                draggable={false} />
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">О нашей клинике</h1>
              <p className="text-sky-100 max-w-xl mx-auto leading-relaxed">
                InClinic — современная медицинская клиника нового поколения, где каждый пациент получает
                профессиональную помощь, внимание и заботу.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Description */}
        <AnimatedSection delay={80}>
          <div className="glass-card p-7 space-y-4">
            <h2 className="text-lg font-bold glass-card-title">Наша миссия</h2>
            <p className="glass-card-desc leading-relaxed">
              Мы создаём медицинский опыт, который запоминается. Наша цель — сделать качественную медицинскую
              помощь доступной и удобной для каждого жителя Душанбе. Современные технологии и опытные
              специалисты работают вместе, чтобы вы чувствовали заботу с первого обращения.
            </p>
            <p className="glass-card-desc leading-relaxed">
              Онлайн-запись, уведомления в Telegram, прозрачные цены и профессиональный подход —
              это основа нашего сервиса.
            </p>
          </div>
        </AnimatedSection>

        {/* Stats */}
        <AnimatedSection delay={120}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { v:"5+",   l:"Лет работы" },
              { v:"15+",  l:"Специалистов" },
              { v:"500+", l:"Пациентов/мес" },
              { v:"98%",  l:"Удовлетворённость" },
            ].map((s, i) => (
              <TiltCard key={i} className="glass-card p-5 text-center" intensity={8} glowColor="rgba(56,189,248,0.28)">
                <div className="text-2xl font-bold neon-blue mb-1">{s.v}</div>
                <div className="text-xs glass-card-meta">{s.l}</div>
              </TiltCard>
            ))}
          </div>
        </AnimatedSection>

        {/* Values */}
        <AnimatedSection delay={160}>
          <h2 className="text-lg font-bold glass-card-title mb-4">Наши принципы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALUES.map((v, i) => (
              <AnimatedSection key={v.title} delay={160 + i * 60}>
                <TiltCard className="glass-card p-6" intensity={8} glowColor="rgba(56,189,248,0.28)">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 theme-icon-box">
                    {v.icon}
                  </div>
                  <h3 className="font-bold glass-card-title mb-1.5">{v.title}</h3>
                  <p className="glass-card-desc text-sm leading-relaxed">{v.desc}</p>
                </TiltCard>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection delay={320}>
          <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold glass-card-title">Готовы записаться?</h3>
              <p className="glass-card-meta text-sm mt-0.5">Онлайн-запись занимает меньше минуты</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/doctors" className="btn-ghost text-sm py-2.5">Найти врача</Link>
              <Link href="/booking" className="btn-primary">Записаться →</Link>
            </div>
          </div>
        </AnimatedSection>

      </div>
    </div>
  );
}
