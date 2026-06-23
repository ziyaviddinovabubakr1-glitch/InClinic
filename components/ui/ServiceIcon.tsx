import {
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

/** 3D medical service icon — transparent background, no container box. */
export default function ServiceIcon({
  name,
  nameRu,
  nameTj,
  size = "md",
  className = "",
}: ServiceIconProps) {
  const key = inferServiceIconName(name, nameRu, nameTj);
  const dim = DIM[size];
  const src = SERVICE_ICON_ASSETS[key];

  return (
    <div
      className={`service-icon-3d ${className}`}
      style={{
        width: dim,
        height: dim,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="service-icon-3d-img"
        style={{
          width: dim,
          height: dim,
          objectFit: "contain",
          filter: "drop-shadow(0 5px 10px rgba(0,0,0,0.22))",
        }}
      />
    </div>
  );
}
