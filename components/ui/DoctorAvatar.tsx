import { getDoctorAvatarAsset } from "@/lib/doctor-gender";
import { getDoctorIconAspect } from "@/lib/doctor-icon-aspect";

type Size = "sm" | "md" | "lg" | "xl";

const WIDTH: Record<Size, number> = { sm: 52, md: 68, lg: 84, xl: 96 };

interface DoctorAvatarProps {
  photoUrl?: string | null;
  name?: string;
  size?: Size;
  className?: string;
}

/** 3D doctor avatar — photo or gendered clay icon, full torso visible. */
export default function DoctorAvatar({
  photoUrl,
  name = "",
  size = "md",
  className = "",
}: DoctorAvatarProps) {
  const dim = WIDTH[size];
  const aspect = getDoctorIconAspect(name);
  const frameH = Math.round(dim * aspect);

  if (photoUrl) {
    return (
      <div
        className={`doctor-avatar-3d doctor-avatar-3d--photo ${className}`}
        style={{
          width: dim,
          height: frameH,
          flexShrink: 0,
          overflow: "hidden",
          borderRadius: 12,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={name}
          className="doctor-avatar-3d-img"
          width={dim}
          height={frameH}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        />
      </div>
    );
  }

  const src = getDoctorAvatarAsset(name);

  return (
    <div
      className={`doctor-avatar-3d doctor-avatar-3d--portrait ${className}`}
      style={{
        width: dim,
        height: frameH,
        flexShrink: 0,
        overflow: "visible",
        lineHeight: 0,
      }}
      title={name || undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name || "Doctor"}
        className="doctor-avatar-3d-img"
        width={dim}
        height={frameH}
        decoding="async"
        style={{
          width: dim,
          height: frameH,
          objectFit: "contain",
          objectPosition: "center bottom",
          display: "block",
          filter: "drop-shadow(0 6px 14px rgba(0, 0, 0, 0.32))",
        }}
      />
    </div>
  );
}
