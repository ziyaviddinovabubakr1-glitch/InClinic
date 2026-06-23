import { IconDoctor } from "@/components/ui/Icons";

type Size = "sm" | "md" | "lg" | "xl";

const DIM: Record<Size, number> = { sm: 40, md: 56, lg: 72, xl: 80 };

interface DoctorAvatarProps {
  photoUrl?: string | null;
  name?: string;
  size?: Size;
  className?: string;
}

/** iOS-style circular doctor avatar with photo or tinted fallback. */
export default function DoctorAvatar({
  photoUrl,
  name = "",
  size = "md",
  className = "",
}: DoctorAvatarProps) {
  const dim = DIM[size];
  const shell = {
    width: dim,
    height: dim,
    borderRadius: "50%",
    background:
      "linear-gradient(145deg, rgba(14,165,233,0.32) 0%, rgba(6,182,212,0.16) 100%)",
    border: "1px solid rgba(125,211,252,0.42)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 16px rgba(14,165,233,0.22)",
    flexShrink: 0,
  };

  if (photoUrl) {
    return (
      <div
        className={`doctor-avatar-ios overflow-hidden ${className}`}
        style={shell}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`doctor-avatar-ios flex items-center justify-center ${className}`}
      style={shell}
      aria-hidden={!name}
      title={name || undefined}
    >
      <IconDoctor size={Math.round(dim * 0.44)} />
    </div>
  );
}
