-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Patient_clinicId_email_idx" ON "Patient"("clinicId", "email");

-- CreateIndex
CREATE INDEX "Patient_clinicId_deletedAt_idx" ON "Patient"("clinicId", "deletedAt");
