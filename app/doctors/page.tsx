import { prisma } from "@/lib/prisma";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { resolvePublicClinicId } from "@/lib/clinic-server";
import { allowMockFallback } from "@/lib/env";
import AnimatedSection from "@/components/ui/AnimatedSection";
import TiltCard from "@/components/ui/TiltCard";
import { IconDoctor } from "@/components/ui/Icons";

interface Doctor {
  id: string; nameRu: string; specialtyRu: string;
  photoUrl: string | null; workDays: number[]; workStart: string; workEnd: string;
}

const DAY_NAMES = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

async function getDoctors(): Promise<Doctor[]> {
  try {
    const clinicId = await resolvePublicClinicId();
    if (!clinicId) throw new Error("no clinic");
    const data = await prisma.doctor.findMany({
      where: { clinicId, active: true }, orderBy: { nameRu: "asc" },
      select: { id:true, nameRu:true, specialtyRu:true, photoUrl:true, workDays:true, workStart:true, workEnd:true },
    });
    return data.length ? data : MOCK_DOCTORS as Doctor[];
  } catch {
    return allowMockFallback() ? (MOCK_DOCTORS as Doctor[]) : [];
  }
}

export const metadata = { title: "Врачи" };

export default async function DoctorsPage() {
  const doctors = await getDoctors();
  const specialties = Array.from(new Set(doctors.map((d) => d.specialtyRu)));

  return (
    <div className="min-h-screen page-pad">
      <div className="max-w-6xl mx-auto">

        <AnimatedSection className="mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-3 neon-blue theme-pill">
              <IconDoctor size={14} /> Наша команда
            </div>
            <h1 className="text-2xl md:text-3xl font-bold neon-blue">Специалисты клиники</h1>
            <p className="text-theme-muted mt-1">{doctors.length} специалистов</p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={50} className="mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-medium neon-blue theme-pill">
              Все специальности
            </span>
            {specialties.slice(0, 6).map((sp) => (
              <span key={sp}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-theme-muted theme-pill">
                {sp}
              </span>
            ))}
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {doctors.map((doctor, i) => (
            <AnimatedSection key={doctor.id} delay={i * 60} className="flex">
              <TiltCard className="glass-card overflow-hidden flex flex-col w-full group"
                intensity={9} glowColor="rgba(56,189,248,0.28)">
                <div className="h-20 flex-shrink-0 relative"
                  style={{ background:"linear-gradient(135deg,rgba(14,165,233,0.32),rgba(6,182,212,0.18))" }}>
                  <div className="absolute inset-0 medical-grid-light opacity-25" />
                  <div className="absolute -bottom-9 inset-x-0 flex justify-center">
                    <div className="rounded-full overflow-hidden flex items-center justify-center theme-icon-box"
                      style={{ width:"72px", height:"72px", borderWidth: 3 }}>
                      {doctor.photoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={doctor.photoUrl} alt={doctor.nameRu} className="w-full h-full object-cover" />
                        : <IconDoctor size={32} />}
                    </div>
                  </div>
                </div>
                <div className="pt-11 pb-5 px-4 flex flex-col items-center text-center flex-1">
                  <h3 className="font-bold glass-card-title text-sm leading-snug mb-1.5 group-hover:text-sky-300 transition-colors">
                    {doctor.nameRu}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 neon-blue theme-pill">
                    {doctor.specialtyRu}
                  </span>
                  <p className="text-[10px] glass-card-meta">
                    {doctor.workDays.map((d) => DAY_NAMES[d]).join(", ")}
                    &nbsp;·&nbsp;{doctor.workStart}–{doctor.workEnd}
                  </p>
                </div>
              </TiltCard>
            </AnimatedSection>
          ))}
        </div>

      </div>
    </div>
  );
}
