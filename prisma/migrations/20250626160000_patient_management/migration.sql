-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- AlterEnum UserRole: add RECEPTIONIST
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'RECEPTIONIST';

-- CreateTable Patient
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "email" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender",
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- AlterTable Booking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "patientId" TEXT;

-- AlterTable AuditLog
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "oldData" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "newData" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_clinicId_phoneHash_key" ON "Patient"("clinicId", "phoneHash");
CREATE INDEX IF NOT EXISTS "Patient_clinicId_createdAt_idx" ON "Patient"("clinicId", "createdAt");
CREATE INDEX IF NOT EXISTS "Patient_clinicId_lastName_firstName_idx" ON "Patient"("clinicId", "lastName", "firstName");
CREATE INDEX IF NOT EXISTS "Patient_clinicId_phone_idx" ON "Patient"("clinicId", "phone");
CREATE INDEX IF NOT EXISTS "Booking_patientId_idx" ON "Booking"("patientId");
CREATE INDEX IF NOT EXISTS "Booking_clinicId_patientId_idx" ON "Booking"("clinicId", "patientId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT IF EXISTS "Patient_clinicId_fkey";
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_patientId_fkey";
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
