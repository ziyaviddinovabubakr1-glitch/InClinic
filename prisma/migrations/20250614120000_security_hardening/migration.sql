-- Partial unique index: one active booking per doctor slot
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_active_slot_unique"
ON "Booking" ("clinicId", "doctorId", "date", "timeSlot")
WHERE status IN ('PENDING', 'ACCEPTED');
