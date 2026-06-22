"use client";

import { useTheme } from "@/lib/theme";

type Size = "xs" | "sm" | "md" | "lg" | "hero";

const SIZES: Record<Size, string> = {
  xs:   "70px",
  sm:   "clamp(32px, 4.5vw, 40px)",
  md:   "clamp(128px, 16vw, 190px)",
  lg:   "clamp(158px, 20vw, 220px)",
  hero: "clamp(178px, 24vw, 260px)",
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
        src="/logo-icon-512.png"
        alt="InClinic"
        draggable={false}
        className="brand-logo-img"
        style={{ width: dim, height: dim }}
      />
    </div>
  );
}
