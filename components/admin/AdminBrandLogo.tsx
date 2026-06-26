"use client";

import { useEffect, useState } from "react";
import type { BrandAsset } from "@/lib/clinic-brand";
import { getBrandAsset } from "@/lib/clinic-brand";

type Variant = "icon" | "full";
type Size = "xs" | "sm" | "md" | "lg" | "hero";

const ICON_PX: Record<Size, number> = { xs: 26, sm: 38, md: 54, lg: 72, hero: 96 };
const FULL_H: Record<Size, number> = { xs: 28, sm: 32, md: 44, lg: 56, hero: 72 };

interface Props {
  variant?: Variant;
  size?: Size;
  animate?: boolean;
  className?: string;
  /** admin — логотип панели; site — логотип публичного сайта */
  context?: "admin" | "site";
}

export default function AdminBrandLogo({
  variant = "icon",
  size = "md",
  animate = false,
  className = "",
  context = "admin",
}: Props) {
  const [custom, setCustom] = useState<string | null>(null);

  useEffect(() => {
    const asset: BrandAsset = context === "admin"
      ? (variant === "full" ? "adminLogo" : "adminLogo")
      : (variant === "full" ? "siteLogo" : "siteLogo");
    const read = () => setCustom(getBrandAsset(asset));
    read();
    window.addEventListener("inclinic-brand-updated", read);
    return () => window.removeEventListener("inclinic-brand-updated", read);
  }, [context, variant]);

  const fallback = variant === "full" ? "/logo-full.png" : "/logo-icon-512.png";
  const src = custom ?? fallback;
  const cls = [
    "oa-brand-logo",
    variant === "full" ? "oa-brand-logo--full" : "",
    animate ? "oa-brand-logo--animate" : "",
    className,
  ].filter(Boolean).join(" ");

  if (variant === "full") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="InClinic"
        draggable={false}
        className={cls}
        style={{ height: FULL_H[size], width: "auto", maxWidth: "100%" }}
      />
    );
  }

  const dim = ICON_PX[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="InClinic"
      draggable={false}
      className={cls}
      style={{ width: dim, height: dim }}
    />
  );
}
