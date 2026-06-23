import { getDoctorAvatarAsset } from "@/lib/doctor-gender";

type Size = "sm" | "md" | "lg" | "xl";

const DIM: Record<Size, number> = { sm: 44, md: 56, lg: 72, xl: 80 };

interface DoctorAvatarProps {
  photoUrl?: string | null;
  name?: string;
  size?: Size;
  className?: string;
}

/** 3D doctor avatar — photo or gendered clay icon on transparent background. */
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
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  const src = getDoctorAvatarAsset(name);

  return (
    <div
      className={`doctor-avatar-3d ${className}`}
      style={{
        width: dim,
        height: dim,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
      title={name || undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name || "Doctor"}
        className="doctor-avatar-3d-img"
        style={{
          width: dim,
          height: dim,
          objectFit: "contain",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
        }}
      />
    </div>
  );
}
