import {
  getServiceIconPalette,
  inferServiceIconName,
  SERVICE_ICON_ASSETS,
} from "@/lib/service-icons";

type Size = "sm" | "md" | "lg";

const DIM: Record<Size, number> = { sm: 48, md: 56, lg: 64 };

interface ServiceIconProps {
  name?: string | null;
  nameRu?: string | null;
  nameTj?: string | null;
  size?: Size;
  className?: string;
}

/** 3D clay-style medical service icon. */
export default function ServiceIcon({
  name,
  nameRu,
  nameTj,
  size = "md",
  className = "",
}: ServiceIconProps) {
  const key = inferServiceIconName(name, nameRu, nameTj);
  const palette = getServiceIconPalette(name, nameRu, nameTj);
  const dim = DIM[size];
  const src = SERVICE_ICON_ASSETS[key];

  return (
    <div
      className={`service-icon-3d ${className}`}
      style={{
        width: dim,
        height: dim,
        borderRadius: Math.round(dim * 0.22),
        background: `radial-gradient(circle at 35% 25%, ${palette.icon}22 0%, ${palette.bg} 55%, transparent 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="service-icon-3d-img"
        style={{
          width: Math.round(dim * 0.88),
          height: Math.round(dim * 0.88),
          objectFit: "contain",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.28))",
        }}
      />
    </div>
  );
}
