import { prisma } from "@/lib/prisma";
import { MOCK_SERVICES } from "@/lib/mockData";
import { resolvePublicClinicId } from "@/lib/clinic-server";
import { allowMockFallback } from "@/lib/env";
import AnimatedSection from "@/components/ui/AnimatedSection";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { getServiceIconPalette } from "@/lib/service-icons";
import { IconClock } from "@/components/ui/Icons";

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
    <div className="min-h-screen text-white page-pad site-page">
      <div className="max-w-6xl mx-auto">

        <AnimatedSection animate className="mb-10 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="neon-subtitle text-theme-muted mb-3">Все направления</p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-theme">
                Каталог услуг
              </h1>
              <p className="text-theme-muted text-sm mt-3">
                {services.length} услуг доступно
              </p>
            </div>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-12">
          {services.map((service) => {
            const color = getServiceIconPalette(
              service.iconName ?? null,
              service.nameRu,
              null
            );
            return (
              <div key={service.id} className="glass-card flex flex-col w-full overflow-hidden">
                <div className="h-0.5 w-full" style={{ background:`linear-gradient(90deg,${color.icon},${color.accent})` }} />
                <div className="p-5 md:p-7 flex flex-col flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <ServiceIcon
                      name={service.iconName}
                      nameRu={service.nameRu}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base glass-card-title mb-1.5">
                        {service.nameRu}
                      </h2>
                      {service.price != null && (
                        <div className="text-sm glass-card-price">
                          {(service.price as number).toLocaleString()}{" "}
                          <span className="text-xs glass-card-meta font-normal">сомони</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm glass-card-desc flex-1 line-clamp-3 leading-relaxed">
                    {service.descriptionRu}
                  </p>
                  <div className="mt-5 pt-4 border-t theme-border-b flex items-center gap-2 text-xs glass-card-meta">
                    <IconClock size={14} className="opacity-80" />
                    <span>{service.durationMin} мин</span>
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
