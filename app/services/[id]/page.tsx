import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolvePublicClinicId } from "@/lib/clinic-server";
import AnimatedSection from "@/components/ui/AnimatedSection";

interface Props {
  params: { id: string };
}

async function getService(id: string) {
  try {
    const clinicId = await resolvePublicClinicId();
    if (!clinicId) return null;
    return await prisma.service.findFirst({
      where: { id, clinicId, active: true },
      include: {
        doctors: {
          include: {
            doctor: {
              select: {
                id: true,
                nameRu: true,
                specialtyRu: true,
                photoUrl: true,
                active: true,
              },
            },
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const service = await getService(params.id);
  return {
    title: service?.nameRu ?? "Услуга",
    description: service?.descriptionRu,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const service = await getService(params.id);
  if (!service) notFound();

  const activeDoctors = service.doctors
    .map((ds) => ds.doctor)
    .filter((d) => d.active);

  const indications = service.indicationsRu
    ? service.indicationsRu.split("\n").filter(Boolean)
    : [];
  const advantages = service.advantagesRu
    ? service.advantagesRu.split("\n").filter(Boolean)
    : [];
  const preparation = service.preparationRu
    ? service.preparationRu.split("\n").filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-[#f8faff] text-slate-900">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="relative py-20 px-6 overflow-hidden border-b border-slate-200/70 bg-white">
        <div className="absolute inset-0 medical-grid-light" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(14,165,233,0.07) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-4xl mx-auto">
          <Link href="/services" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-500 text-sm mb-8 transition-colors">
            ← Все услуги
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3" style={{ animation: "fadeInUp 0.6s ease-out both" }}>
                {service.nameRu}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-400" style={{ animation: "fadeIn 0.6s ease-out 0.2s both" }}>
                <span>⏱ {service.durationMin} мин</span>
                {service.price !== null && (
                  <span className="text-sky-600 font-semibold">{service.price.toLocaleString()} сомони</span>
                )}
                {activeDoctors.length > 0 && <span>👨‍⚕️ {activeDoctors.length} специалистов</span>}
              </div>
            </div>
            <Link href={`/booking?service=${service.id}`} className="btn-primary-lg flex-shrink-0" style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}>
              Записаться на приём
            </Link>
          </div>
        </div>
      </div>

      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Description */}
          <AnimatedSection>
            <div className="glass-card p-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span>📋</span> Описание
              </h2>
              <p className="text-slate-600 leading-relaxed">{service.descriptionRu}</p>
            </div>
          </AnimatedSection>

          {/* Indications */}
          {indications.length > 0 && (
            <AnimatedSection>
              <div className="glass-card p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>✅</span> Показания
                </h2>
                <ul className="space-y-2">
                  {indications.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600">
                      <span className="text-sky-500 flex-shrink-0 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          )}

          {/* Advantages */}
          {advantages.length > 0 && (
            <AnimatedSection>
              <div className="glass-card p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <span>⭐</span> Преимущества
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {advantages.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-100">
                      <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-600 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Preparation */}
          {preparation.length > 0 && (
            <AnimatedSection>
              <div className="glass-card p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>📌</span> Подготовка к приёму
                </h2>
                <ol className="space-y-3">
                  {preparation.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600">
                      <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 bg-sky-100 text-sky-600">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            </AnimatedSection>
          )}

          {/* Doctors */}
          {activeDoctors.length > 0 && (
            <AnimatedSection>
              <div className="glass-card p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <span>👨‍⚕️</span> Врачи по данной услуге
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeDoctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-sky-100" style={{ background: "linear-gradient(135deg, #e0f2fe, #f0f9ff)" }}>
                        {doctor.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={doctor.photoUrl} alt={doctor.nameRu} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">👨‍⚕️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-900 font-medium truncate">{doctor.nameRu}</div>
                        <div className="text-sky-500 text-sm truncate">{doctor.specialtyRu}</div>
                      </div>
                      <Link href={`/booking?service=${service.id}&doctor=${doctor.id}`} className="btn-primary text-xs px-3 py-2 flex-shrink-0">
                        Записаться
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* CTA */}
          <AnimatedSection>
            <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", boxShadow: "0 8px 32px rgba(14,165,233,0.25)" }}>
              <h3 className="text-xl font-semibold text-white mb-2">Готовы записаться?</h3>
              <p className="text-sky-100 mb-6 text-sm">Выберите удобное время и специалиста — это займёт 2 минуты</p>
              <Link href={`/booking?service=${service.id}`} className="bg-white text-sky-600 font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:bg-sky-50 inline-block">
                Записаться на приём
              </Link>
            </div>
          </AnimatedSection>

        </div>
      </div>
    </main>
  );
}
