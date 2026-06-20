"use client";

type Variant = "icon" | "full";
type Size = "sm" | "md" | "lg" | "hero";

const ICON_PX: Record<Size, number> = { sm: 38, md: 54, lg: 72, hero: 96 };
const FULL_H: Record<Size, number> = { sm: 32, md: 44, lg: 56, hero: 72 };

interface Props {
  /** icon — квадратная иконка; full — горизонтальный логотип с названием */
  variant?: Variant;
  size?: Size;
  animate?: boolean;
  className?: string;
}

export default function AdminBrandLogo({
  variant = "icon",
  size = "md",
  animate = false,
  className = "",
}: Props) {
  const src = variant === "full" ? "/logo-full.png" : "/logo-icon-512.png";
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
