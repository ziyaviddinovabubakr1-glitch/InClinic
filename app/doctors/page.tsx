import { prisma } from "@/lib/prisma";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { resolvePublicClinicId } from "@/lib/clinic-server";
import { allowMockFallback } from "@/lib/env";
import AnimatedSection from "@/components/ui/AnimatedSection";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
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
    <div className="min-h-screen page-pad site-page">
      <div className="max-w-6xl mx-auto">

        <AnimatedSection animate className="mb-10 md:mb-12">
          <p className="neon-subtitle neon-blue mb-3 flex items-center gap-2">
            <IconDoctor size={14} /> Наша команда
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-theme">
            Специалисты клиники
          </h1>
          <p className="text-theme-muted text-sm mt-3">{doctors.length} специалистов</p>
        </AnimatedSection>

        <div className="flex flex-wrap gap-2 mb-8 md:mb-10">
          <span className="px-3 py-1.5 rounded-xl text-xs font-medium text-theme theme-pill">
            Все специальности
          </span>
          {specialties.slice(0, 6).map((sp) => (
            <span key={sp}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-theme-muted theme-pill">
              {sp}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="glass-card overflow-hidden flex flex-col w-full">
              <div className="h-24 flex-shrink-0 relative"
                style={{ background:"linear-gradient(135deg,rgba(14,165,233,0.22),rgba(6,182,212,0.12))" }}>
                <div className="absolute -bottom-[3.25rem] inset-x-0 flex justify-center">
                  <DoctorAvatar
                    photoUrl={doctor.photoUrl}
                    name={doctor.nameRu}
                    size="lg"
                  />
                </div>
              </div>
              <div className="pt-14 pb-6 px-5 flex flex-col items-center text-center flex-1">
                <h3 className="font-semibold glass-card-title text-sm leading-snug mb-1.5">
                  {doctor.nameRu}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 text-theme-muted theme-pill">
                  {doctor.specialtyRu}
                </span>
                <p className="text-[10px] glass-card-meta leading-relaxed">
                  {doctor.workDays.map((d) => DAY_NAMES[d]).join(", ")}
                  &nbsp;·&nbsp;{doctor.workStart}–{doctor.workEnd}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
