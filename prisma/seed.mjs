import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5, 6]; // Пн–Сб, вс — выходной

const prisma = new PrismaClient();

const DEMO_SERVICES = [
  {
    nameRu: "Терапия",
    nameTj: "Табобат",
    descriptionRu: "Диагностика и лечение заболеваний внутренних органов.",
    descriptionTj: "Ташхис ва табобати бемориҳои узвҳои дохилӣ.",
    durationMin: 30,
    price: 150,
    iconName: "default",
  },
  {
    nameRu: "Кардиология",
    nameTj: "Кардиология",
    descriptionRu: "Диагностика и лечение заболеваний сердца и сосудов.",
    descriptionTj: "Ташхис ва табобати бемориҳои дил ва рагҳо.",
    durationMin: 45,
    price: 250,
    iconName: "heart",
  },
  {
    nameRu: "Неврология",
    nameTj: "Неврология",
    descriptionRu: "Диагностика и лечение заболеваний нервной системы.",
    descriptionTj: "Ташхис ва табобати бемориҳои системаи асаб.",
    durationMin: 40,
    price: 200,
    iconName: "brain",
  },
  {
    nameRu: "Офтальмология",
    nameTj: "Офтальмология",
    descriptionRu: "Проверка зрения и лечение глазных заболеваний.",
    descriptionTj: "Санҷиши биноӣ ва табобати бемориҳои чашм.",
    durationMin: 30,
    price: 180,
    iconName: "eye",
  },
];

const DEMO_DOCTORS = [
  {
    nameRu: "Алиев Бахром Содикович",
    nameTj: "Алиев Баҳром Содиқович",
    specialtyRu: "Терапевт",
    specialtyTj: "Терапевт",
    workDays: DEFAULT_WORK_DAYS,
    workStart: "09:00",
    workEnd: "17:00",
    serviceIndexes: [0],
  },
  {
    nameRu: "Рахимова Зарина Камолевна",
    nameTj: "Раҳимова Зарина Камолевна",
    specialtyRu: "Кардиолог",
    specialtyTj: "Кардиолог",
    workDays: DEFAULT_WORK_DAYS,
    workStart: "08:00",
    workEnd: "16:00",
    serviceIndexes: [1],
  },
  {
    nameRu: "Исмоилов Давлат Хасанович",
    nameTj: "Исмоилов Давлат Ҳасанович",
    specialtyRu: "Невролог",
    specialtyTj: "Невролог",
    workDays: DEFAULT_WORK_DAYS,
    workStart: "09:00",
    workEnd: "17:00",
    serviceIndexes: [2],
  },
  {
    nameRu: "Каримова Мадина Юсуфовна",
    nameTj: "Каримова Мадина Юсуфовна",
    specialtyRu: "Офтальмолог",
    specialtyTj: "Офтальмолог",
    workDays: DEFAULT_WORK_DAYS,
    workStart: "09:00",
    workEnd: "15:00",
    serviceIndexes: [3],
  },
];

async function main() {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "default";
  const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME ?? "InClinic";

  const clinic = await prisma.clinic.upsert({
    where: { slug },
    update: { name: clinicName },
    create: { slug, name: clinicName },
  });

  const username = (process.env.ADMIN_USERNAME ?? "Abubakr").trim();
  const password = process.env.ADMIN_PASSWORD ?? "InClinic2026!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.updateMany({
    where: { role: "OWNER", username: { not: username } },
    data: { active: false },
  });

  await prisma.user.upsert({
    where: { username },
    update: { passwordHash, role: "OWNER", clinicId: clinic.id, active: true },
    create: {
      username,
      passwordHash,
      role: "OWNER",
      clinicId: clinic.id,
      active: true,
    },
  });

  const serviceCount = await prisma.service.count({ where: { clinicId: clinic.id } });
  if (serviceCount === 0) {
    const services = await Promise.all(
      DEMO_SERVICES.map((s) =>
        prisma.service.create({ data: { ...s, clinicId: clinic.id } })
      )
    );

    for (const doc of DEMO_DOCTORS) {
      const { serviceIndexes, ...doctorData } = doc;
      const doctor = await prisma.doctor.create({
        data: { ...doctorData, clinicId: clinic.id },
      });

      for (const idx of serviceIndexes) {
        const service = services[idx];
        if (!service) continue;
        await prisma.doctorService.create({
          data: { doctorId: doctor.id, serviceId: service.id },
        });
      }
    }
  }

  // Исправить старые расписания: было много выходных (Пн–Пт или 2–3 дня в неделю)
  const existingDoctors = await prisma.doctor.findMany({ where: { clinicId: clinic.id } });
  let scheduleFixed = 0;
  for (const doc of existingDoctors) {
    if (doc.workDays.length < 6) {
      await prisma.doctor.update({
        where: { id: doc.id },
        data: { workDays: DEFAULT_WORK_DAYS },
      });
      scheduleFixed++;
    }
  }
  if (scheduleFixed > 0) {
    console.log(`Updated workDays for ${scheduleFixed} doctor(s) → Mon–Sat`);
  }

  const ICON_BY_NAME = [
    { match: /карди|cardio|дил\b/i, iconName: "heart" },
    { match: /невр|neuro|асаб/i, iconName: "brain" },
    { match: /офтальм|oftalm|чашм|бино/i, iconName: "eye" },
    { match: /ортоп|bone|кост/i, iconName: "bone" },
    { match: /стомат|dental|дандон/i, iconName: "tooth" },
    { match: /дермат|skin|пост/i, iconName: "skin" },
    { match: /лабор|lab|анализ/i, iconName: "lab" },
  ];

  const existingServices = await prisma.service.findMany({ where: { clinicId: clinic.id } });
  let iconsFixed = 0;
  for (const svc of existingServices) {
    if (svc.iconName) continue;
    const text = `${svc.nameRu} ${svc.nameTj}`;
    let iconName = "default";
    for (const rule of ICON_BY_NAME) {
      if (rule.match.test(text)) {
        iconName = rule.iconName;
        break;
      }
    }
    await prisma.service.update({
      where: { id: svc.id },
      data: { iconName },
    });
    iconsFixed++;
  }
  if (iconsFixed > 0) {
    console.log(`Backfilled iconName for ${iconsFixed} service(s)`);
  }

  console.log(`Seeded clinic "${clinic.slug}", owner "${username}", demo doctors/services`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
