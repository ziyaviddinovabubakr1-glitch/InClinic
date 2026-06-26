"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";
import { getBrandAsset } from "@/lib/clinic-brand";

type Size = "xs" | "sm" | "md" | "lg" | "hero";

const SIZES: Record<Size, string> = {
  xs:   "clamp(28px, 3.5vw, 34px)",
  sm:   "clamp(28px, 3.5vw, 36px)",
  md:   "clamp(96px, 12vw, 140px)",
  lg:   "clamp(120px, 15vw, 170px)",
  hero: "clamp(140px, 18vw, 200px)",
};

interface Props {
  size?: Size;
  showGlow?: boolean;
  animate?: boolean;
  className?: string;
}

export default function BrandLogo({
  size = "md",
  showGlow = false,
  animate = false,
  className = "",
}: Props) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dim = SIZES[size];
  const [src, setSrc] = useState("/logo-icon-512.png");

  useEffect(() => {
    const read = () => setSrc(getBrandAsset("siteLogo") ?? "/logo-icon-512.png");
    read();
    window.addEventListener("inclinic-brand-updated", read);
    return () => window.removeEventListener("inclinic-brand-updated", read);
  }, []);

  return (
    <div
      className={[
        "brand-logo-wrap",
        `brand-logo-wrap--${size}`,
        animate ? "brand-logo-wrap--animate" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      {showGlow && !isLight && <div className="brand-logo-soft-glow" aria-hidden />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="InClinic"
        draggable={false}
        className="brand-logo-img"
        style={{ width: dim, height: dim }}
      />
    </div>
  );
}
