import { prisma } from "@/lib/prisma";
import { MOCK_SERVICES } from "@/lib/mockData";
import { resolvePublicClinicId } from "@/lib/clinic-server";
import { allowMockFallback } from "@/lib/env";
import AnimatedSection from "@/components/ui/AnimatedSection";

const SERVICE_ICONS: Record<string, string> = {
  heart:"🫀", brain:"🧠", bone:"🦴", eye:"👁️",
  tooth:"🦷", skin:"🩹", lab:"🔬", default:"🩺",
};

const SERVICE_COLORS: Record<string, { bg:string; border:string; icon:string; accent:string }> = {
  heart:   { bg:"rgba(225,29,72,0.22)",   border:"rgba(225,29,72,0.45)",   icon:"#fb7185", accent:"#fda4af" },
  brain:   { bg:"rgba(147,51,234,0.22)",  border:"rgba(147,51,234,0.45)",  icon:"#a78bfa", accent:"#d8b4fe" },
  bone:    { bg:"rgba(217,119,6,0.22)",   border:"rgba(217,119,6,0.45)",   icon:"#fbbf24", accent:"#fcd34d" },
  eye:     { bg:"rgba(5,150,105,0.22)",   border:"rgba(5,150,105,0.45)",   icon:"#34d399", accent:"#6ee7b7" },
  tooth:   { bg:"rgba(37,99,235,0.22)",   border:"rgba(37,99,235,0.45)",   icon:"#60a5fa", accent:"#93c5fd" },
  skin:    { bg:"rgba(219,39,119,0.22)",  border:"rgba(219,39,119,0.45)",  icon:"#f472b6", accent:"#f9a8d4" },
  lab:     { bg:"rgba(2,132,199,0.22)",   border:"rgba(2,132,199,0.45)",   icon:"#38bdf8", accent:"#7dd3fc" },
  default: { bg:"rgba(2,132,199,0.22)",   border:"rgba(2,132,199,0.45)",   icon:"#38bdf8", accent:"#7dd3fc" },
};

function getColor(iconName: string | null) {
  return SERVICE_COLORS[iconName ?? "default"] ?? SERVICE_COLORS.default;
}

async function getServices() {
  try {
    const clinicId = await resolvePublicClinicId();
    if (!clinicId) throw new Error("no clinic");
    const services = await prisma.service.findMany({
      where: { clinicId, active: true }, orderBy: { nameRu: "asc" },
      select: {
        id:true, nameRu:true, descriptionRu:true, durationMin:true, price:true, iconName:true,
        _count:{ select:{ doctors:true } },
      },
    });
    return services.length ? services : MOCK_SERVICES;
  } catch {
    return allowMockFallback() ? MOCK_SERVICES : [];
  }
}

export const metadata = { title:"Услуги", description:"Каталог медицинских услуг клиники InClinic" };

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="min-h-screen text-white page-pad">
      <div className="max-w-6xl mx-auto">

        <AnimatedSection animate className="mb-10 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="neon-subtitle neon-blue mb-3">Все направления</p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-theme">
                Каталог услуг
              </h1>
              <p className="text-theme-muted text-sm mt-3">
                {services.length} услуг доступно
              </p>
            </div>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mb-12">
          {services.map((service) => {
            const color = getColor(service.iconName ?? null);
            return (
              <div key={service.id} className="glass-card flex flex-col w-full overflow-hidden">
                <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,${color.icon},${color.accent})` }} />
                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-5">
                    <div className="icon-box"
                      style={{ background:color.bg, border:`1.5px solid ${color.border}`, color:color.icon }}>
                      {SERVICE_ICONS[service.iconName ?? ""] ?? SERVICE_ICONS.default}
                    </div>
                    {service.price != null && (
                      <div className="text-right">
                        <div className="text-lg glass-card-price">
                          {(service.price as number).toLocaleString()}
                        </div>
                        <div className="text-xs glass-card-meta">сомони</div>
                      </div>
                    )}
                  </div>
                  <h2 className="text-base glass-card-title mb-2">
                    {service.nameRu}
                  </h2>
                  <p className="text-sm glass-card-desc flex-1 line-clamp-3 leading-relaxed">
                    {service.descriptionRu}
                  </p>
                  <div className="mt-6 pt-4 border-t theme-border-b">
                    <span className="text-xs glass-card-meta">⏱ {service.durationMin} мин</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
