import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";

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
    <div className="min-h-screen page-pad">
      <div className="max-w-4xl mx-auto space-y-10 md:space-y-12">

        <AnimatedSection animate>
          <div className="rounded-2xl p-8 md:p-10 text-center"
            style={{ background:"linear-gradient(135deg,#0284c7,#0ea5e9)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-full.png" alt="InClinic"
              style={{ height:"56px", width:"auto", margin:"0 auto 20px" }}
              draggable={false} />
            <h1 className="text-2xl md:text-3xl font-semibold text-white mb-3">О нашей клинике</h1>
            <p className="text-sky-50 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
              InClinic — современная медицинская клиника, где каждый пациент получает
              профессиональную помощь, внимание и заботу.
            </p>
          </div>
        </AnimatedSection>

        <div className="glass-card p-7 md:p-8 space-y-4">
          <h2 className="text-lg font-semibold glass-card-title">Наша миссия</h2>
          <p className="glass-card-desc leading-relaxed">
            Мы создаём медицинский опыт, который запоминается. Наша цель — сделать качественную медицинскую
            помощь доступной и удобной для каждого жителя Душанбе.
          </p>
          <p className="glass-card-desc leading-relaxed">
            Онлайн-запись, уведомления в Telegram, прозрачные цены и профессиональный подход —
            это основа нашего сервиса.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { v:"5+",   l:"Лет работы" },
            { v:"15+",  l:"Специалистов" },
            { v:"500+", l:"Пациентов/мес" },
            { v:"98%",  l:"Удовлетворённость" },
          ].map((s, i) => (
            <div key={i} className="glass-card p-5 text-center">
              <div className="text-2xl font-semibold text-theme mb-1">{s.v}</div>
              <div className="text-xs glass-card-meta">{s.l}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold glass-card-title mb-6">Наши принципы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="glass-card p-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 theme-icon-box">
                  {v.icon}
                </div>
                <h3 className="font-semibold glass-card-title mb-2">{v.title}</h3>
                <p className="glass-card-desc text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold glass-card-title">Готовы записаться?</h3>
            <p className="glass-card-meta text-sm mt-1">Онлайн-запись занимает меньше минуты</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/doctors" className="btn-ghost text-sm py-2.5">Найти врача</Link>
            <Link href="/booking" className="btn-primary">Записаться →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
