import { prisma } from "@/lib/prisma";

/** Active (non–soft-deleted) patients for a clinic. */
export function activePatientWhere(clinicId: string) {
  return { clinicId, deletedAt: null } as const;
}

export interface PatientDashboardStats {
  totalPatients: number;
  newPatientsToday: number;
  newPatientsWeek: number;
  returningPatients: number;
}

export async function loadPatientDashboardStats(
  clinicId: string,
  today: string,
  weekAgo: string,
): Promise<PatientDashboardStats> {
  const todayStart = new Date(`${today}T00:00:00`);
  const todayEnd = new Date(`${today}T23:59:59.999`);
  const weekStart = new Date(`${weekAgo}T00:00:00`);

  const base = activePatientWhere(clinicId);

  const [totalPatients, newPatientsToday, newPatientsWeek, completedGroups] =
    await Promise.all([
      prisma.patient.count({ where: base }),
      prisma.patient.count({
        where: { ...base, createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.patient.count({
        where: { ...base, createdAt: { gte: weekStart } },
      }),
      prisma.booking.groupBy({
        by: ["patientId"],
        where: {
          clinicId,
          status: "COMPLETED",
          patientId: { not: null },
        },
        _count: { id: true },
      }),
    ]);

  const returningPatients = completedGroups.filter((g) => g._count.id >= 2).length;

  return { totalPatients, newPatientsToday, newPatientsWeek, returningPatients };
}

/** New patient registrations per calendar day (YYYY-MM-DD). */
export async function loadPatientRegistrationsByDay(
  clinicId: string,
  fromDate: string,
): Promise<Map<string, number>> {
  const rows = await prisma.patient.findMany({
    where: {
      ...activePatientWhere(clinicId),
      createdAt: { gte: new Date(`${fromDate}T00:00:00`) },
    },
    select: { createdAt: true },
  });

  const map = new Map<string, number>();
  for (const p of rows) {
    const key = p.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}
