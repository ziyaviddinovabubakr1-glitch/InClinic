import { getDoctorAvatarAsset, inferDoctorGender } from "@/lib/doctor-gender";

type Size = "sm" | "md" | "lg" | "xl";

interface DoctorAvatarProps {
  photoUrl?: string | null;
  name?: string;
  size?: Size;
  className?: string;
}

/** 3D doctor avatar — responsive portrait frame, full torso visible. */
export default function DoctorAvatar({
  photoUrl,
  name = "",
  size = "md",
  className = "",
}: DoctorAvatarProps) {
  const gender = inferDoctorGender(name);
  const sizeClass = `doctor-avatar-3d--size-${size}`;
  const genderClass = gender === "female" ? "doctor-avatar-3d--female" : "doctor-avatar-3d--male";
  const base = `doctor-avatar-3d ${sizeClass} ${genderClass} ${className}`.trim();

  if (photoUrl) {
    return (
      <div className={`${base} doctor-avatar-3d--photo`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={name} className="doctor-avatar-3d-img" decoding="async" />
      </div>
    );
  }

  const src = getDoctorAvatarAsset(name);

  return (
    <div className={`${base} doctor-avatar-3d--portrait`} title={name || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name || "Doctor"}
        className="doctor-avatar-3d-img"
        decoding="async"
      />
    </div>
  );
}
