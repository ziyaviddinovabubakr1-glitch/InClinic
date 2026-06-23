import { DOCTOR_AVATAR_ASSET } from "@/lib/service-icons";

type Size = "sm" | "md" | "lg" | "xl";

const DIM: Record<Size, number> = { sm: 44, md: 56, lg: 72, xl: 80 };

interface DoctorAvatarProps {
  photoUrl?: string | null;
  name?: string;
  size?: Size;
  className?: string;
}

/** 3D doctor avatar with photo or clay-style fallback. */
export default function DoctorAvatar({
  photoUrl,
  name = "",
  size = "md",
  className = "",
}: DoctorAvatarProps) {
  const dim = DIM[size];

  if (photoUrl) {
    return (
      <div
        className={`doctor-avatar-3d overflow-hidden ${className}`}
        style={{
          width: dim,
          height: dim,
          borderRadius: "50%",
          flexShrink: 0,
          boxShadow: "0 6px 18px rgba(14,165,233,0.25)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`doctor-avatar-3d ${className}`}
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 35% 25%, rgba(125,211,252,0.35) 0%, rgba(14,165,233,0.12) 60%, transparent 100%)",
        overflow: "hidden",
      }}
      title={name || undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={DOCTOR_AVATAR_ASSET}
        alt={name || "Doctor"}
        className="doctor-avatar-3d-img"
        style={{
          width: Math.round(dim * 1.05),
          height: Math.round(dim * 1.05),
          objectFit: "cover",
          objectPosition: "center top",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.22))",
        }}
      />
    </div>
  );
}
