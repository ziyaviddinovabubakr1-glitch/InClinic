"use client";

import { useEffect, useRef } from "react";
import { usePendingBookings } from "@/lib/admin/query/hooks";
import { useAdminToast } from "@/components/providers/AdminToastProvider";

/** Shows toast when new pending bookings appear (Step 6). */
export default function AdminBookingAlerts() {
  const { data } = usePendingBookings();
  const { pushToast } = useAdminToast();
  const seen = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    const rows = data?.rows ?? [];
    if (!initialized.current) {
      seen.current = new Set(rows.map((b) => b.id));
      initialized.current = true;
      return;
    }
    for (const b of rows) {
      if (!seen.current.has(b.id)) {
        pushToast({
          title: "Новая запись",
          message: `${b.patientName} · ${b.serviceName}`,
          tone: "info",
        });
        seen.current.add(b.id);
      }
    }
  }, [data, pushToast]);

  return null;
}
