import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

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
    workDays: [1, 2, 3, 4, 5],
    workStart: "09:00",
    workEnd: "17:00",
    serviceIndexes: [0],
  },
  {
    nameRu: "Рахимова Зарина Камолевна",
    nameTj: "Раҳимова Зарина Камолевна",
    specialtyRu: "Кардиолог",
    specialtyTj: "Кардиолог",
    workDays: [1, 2, 3, 4, 5],
    workStart: "08:00",
    workEnd: "16:00",
    serviceIndexes: [1],
  },
  {
    nameRu: "Исмоилов Давлат Хасанович",
    nameTj: "Исмоилов Давлат Ҳасанович",
    specialtyRu: "Невролог",
    specialtyTj: "Невролог",
    workDays: [1, 3, 5],
    workStart: "10:00",
    workEnd: "18:00",
    serviceIndexes: [2],
  },
  {
    nameRu: "Каримова Мадина Юсуфовна",
    nameTj: "Каримова Мадина Юсуфовна",
    specialtyRu: "Офтальмолог",
    specialtyTj: "Офтальмолог",
    workDays: [2, 4],
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

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "change-me";
  const passwordHash = await hashPassword(password);

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
