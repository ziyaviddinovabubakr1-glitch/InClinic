import {
  getServiceIconPalette,
  resolveServiceIconName,
  type ServiceIconName,
} from "@/lib/service-icons";

type Size = "sm" | "md" | "lg";

const DIM: Record<Size, number> = { sm: 40, md: 48, lg: 56 };
const GLYPH: Record<Size, number> = { sm: 20, md: 24, lg: 28 };

interface ServiceIconProps {
  name?: string | null;
  size?: Size;
  className?: string;
}

function Glyph({ name, size, color }: { name: ServiceIconName; size: number; color: string }) {
  const stroke = color;
  const fill = `${color}22`;
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 1.65,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "heart":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M12 20.5s-6.2-3.8-6.2-8.4c0-2.6 2.1-4.2 4.4-4.2 1.4 0 2.6.7 3.3 1.8.7-1.1 1.9-1.8 3.3-1.8 2.3 0 4.4 1.6 4.4 4.2 0 4.6-6.2 8.4-6.2 8.4z"
            fill={fill}
          />
          <path {...common} d="M6 12h2.2l1.3-1.8 1.5 3 1.8-2.4H18" strokeWidth={1.4} />
        </svg>
      );
    case "brain":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M8 6.5c-2.2.3-3.8 2-3.8 4.2 0 1.2.5 2.3 1.3 3.1-.6.8-1 1.8-1 2.9 0 2.4 2 4.3 4.5 4.3h.5c.8 1.2 2.1 2 3.5 2s2.7-.8 3.5-2h.5c2.5 0 4.5-1.9 4.5-4.3 0-1.1-.4-2.1-1-2.9.8-.8 1.3-1.9 1.3-3.1 0-2.2-1.6-3.9-3.8-4.2-.6-1.6-2.1-2.8-4-2.8-1 0-1.9.3-2.7.8C10.9 3.7 9.9 3.4 9 3.4c-1.9 0-3.4 1.2-4 2.8z"
            fill={fill}
          />
          <path {...common} d="M12 6.5v11M9 10h6M9.5 14h5" strokeWidth={1.35} opacity={0.85} />
        </svg>
      );
    case "eye":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"
            fill={fill}
          />
          <circle cx="12" cy="12" r="2.8" fill={fill} stroke={stroke} strokeWidth={1.65} />
          <circle cx="12" cy="12" r="1" fill={stroke} stroke="none" />
        </svg>
      );
    case "bone":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M8.5 4.5a2.2 2.2 0 100 4.4M15.5 15.1a2.2 2.2 0 100 4.4M7.2 16.8l9.6-9.6"
            fill={fill}
          />
          <circle cx="8.5" cy="6.7" r="2.2" fill={fill} stroke={stroke} />
          <circle cx="15.5" cy="17.3" r="2.2" fill={fill} stroke={stroke} />
        </svg>
      );
    case "tooth":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M9 4.5h6c1.8 0 3.2 1.5 3.2 3.3 0 1.9-.8 3.7-1.4 5.5-.5 1.4-.8 2.9-.8 4.4 0 1.5-1.2 2.8-2.7 2.8h-1.2c-.9 0-1.6-.7-1.6-1.6v-1.2c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6v1.2c0 .9-.7 1.6-1.6 1.6H9.7c-1.5 0-2.7-1.3-2.7-2.8 0-1.5-.3-3-.8-4.4-.6-1.8-1.4-3.6-1.4-5.5 0-1.8 1.4-3.3 3.2-3.3z"
            fill={fill}
          />
        </svg>
      );
    case "skin":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <rect x="5" y="9" width="14" height="8" rx="2" {...common} fill={fill} />
          <path {...common} d="M9 9V7.5a3 3 0 016 0V9" />
          <path {...common} d="M12 11v4" strokeWidth={1.4} />
        </svg>
      );
    case "lab":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M10 3h4l4.5 9.2a4.5 4.5 0 01-4 6.5h-5a4.5 4.5 0 01-4-6.5L10 3z"
            fill={fill}
          />
          <path {...common} d="M9.5 10h5" strokeWidth={1.4} />
          <circle cx="10.5" cy="14" r=".9" fill={stroke} stroke="none" />
          <circle cx="14" cy="16" r=".7" fill={stroke} stroke="none" opacity={0.7} />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M6 4v5a6 6 0 0012 0V4" fill={fill} />
          <circle cx="18" cy="18" r="3" fill={fill} stroke={stroke} />
          <path {...common} d="M18 15v-2a4 4 0 00-4-4h-2" />
        </svg>
      );
  }
}

/** iOS-style tinted squircle icon for medical services. */
export default function ServiceIcon({ name, size = "md", className = "" }: ServiceIconProps) {
  const key = resolveServiceIconName(name);
  const palette = getServiceIconPalette(key);
  const dim = DIM[size];
  const glyph = GLYPH[size];

  return (
    <div
      className={`service-icon-ios ${className}`}
      style={{
        width: dim,
        height: dim,
        borderRadius: Math.round(dim * 0.28),
        background: `linear-gradient(145deg, ${palette.bg} 0%, ${palette.icon}18 100%)`,
        border: `1px solid ${palette.border}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 14px ${palette.icon}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Glyph name={key} size={glyph} color={palette.icon} />
    </div>
  );
}
