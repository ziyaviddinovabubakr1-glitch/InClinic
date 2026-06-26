import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPhone(phone) {
  return createHash("sha256").update(phone.replace(/\D/g, "")).digest("hex");
}

async function main() {
  const clinics = await prisma.clinic.findMany({ select: { id: true } });
  let total = 0;
  for (const { id: clinicId } of clinics) {
    const orphans = await prisma.booking.findMany({
      where: { clinicId, patientId: null },
      orderBy: { createdAt: "asc" },
    });
    for (const b of orphans) {
      const phoneHash = hashPhone(b.phone);
      let patient = await prisma.patient.findUnique({
        where: { clinicId_phoneHash: { clinicId, phoneHash } },
      });
      if (!patient) {
        patient = await prisma.patient.create({
          data: {
            clinicId,
            firstName: b.firstName,
            lastName: b.lastName,
            phone: b.phone,
            phoneHash,
          },
        });
      }
      await prisma.booking.update({
        where: { id: b.id },
        data: { patientId: patient.id },
      });
      total++;
    }
  }
  console.log(`Backfill complete: ${total} booking(s) linked to patients`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
