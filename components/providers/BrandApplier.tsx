"use client";

import { useEffect } from "react";
import { applyFaviconFromStorage } from "@/lib/clinic-brand";

export default function BrandApplier() {
  useEffect(() => {
    applyFaviconFromStorage();
    const onUpdate = () => applyFaviconFromStorage();
    window.addEventListener("inclinic-brand-updated", onUpdate);
    return () => window.removeEventListener("inclinic-brand-updated", onUpdate);
  }, []);
  return null;
}
