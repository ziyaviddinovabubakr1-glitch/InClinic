/** Shared palette and 3D asset paths for medical service icons. */

export type ServiceIconName =
  | "heart"
  | "brain"
  | "bone"
  | "eye"
  | "tooth"
  | "skin"
  | "lab"
  | "default";

export interface ServiceIconPalette {
  bg: string;
  border: string;
  icon: string;
  accent: string;
}

export const SERVICE_ICON_ASSETS: Record<ServiceIconName, string> = {
  heart: "/icons/medical/heart.png",
  brain: "/icons/medical/brain.png",
  bone: "/icons/medical/bone.png",
  eye: "/icons/medical/eye.png",
  tooth: "/icons/medical/tooth.png",
  skin: "/icons/medical/skin.png",
  lab: "/icons/medical/lab.png",
  default: "/icons/medical/default.png",
};

export const SERVICE_ICON_COLORS: Record<ServiceIconName, ServiceIconPalette> = {
  heart: {
    bg: "rgba(244, 63, 94, 0.14)",
    border: "rgba(251, 113, 133, 0.35)",
    icon: "#fb7185",
    accent: "#fda4af",
  },
  brain: {
    bg: "rgba(167, 139, 250, 0.14)",
    border: "rgba(167, 139, 250, 0.35)",
    icon: "#a78bfa",
    accent: "#c4b5fd",
  },
  bone: {
    bg: "rgba(251, 191, 36, 0.14)",
    border: "rgba(251, 191, 36, 0.35)",
    icon: "#fbbf24",
    accent: "#fcd34d",
  },
  eye: {
    bg: "rgba(52, 211, 153, 0.14)",
    border: "rgba(52, 211, 153, 0.35)",
    icon: "#34d399",
    accent: "#6ee7b7",
  },
  tooth: {
    bg: "rgba(96, 165, 250, 0.14)",
    border: "rgba(96, 165, 250, 0.35)",
    icon: "#60a5fa",
    accent: "#93c5fd",
  },
  skin: {
    bg: "rgba(244, 114, 182, 0.14)",
    border: "rgba(244, 114, 182, 0.35)",
    icon: "#f472b6",
    accent: "#f9a8d4",
  },
  lab: {
    bg: "rgba(56, 189, 248, 0.14)",
    border: "rgba(56, 189, 248, 0.35)",
    icon: "#38bdf8",
    accent: "#7dd3fc",
  },
  default: {
    bg: "rgba(14, 165, 233, 0.14)",
    border: "rgba(56, 189, 248, 0.35)",
    icon: "#38bdf8",
    accent: "#7dd3fc",
  },
};

const ICON_NAME_RULES: { match: RegExp; icon: ServiceIconName }[] = [
  { match: /карди|cardio|дил\b/i, icon: "heart" },
  { match: /невр|neuro|асаб/i, icon: "brain" },
  { match: /офтальм|oftalm|чашм|бино/i, icon: "eye" },
  { match: /ортоп|bone|кост/i, icon: "bone" },
  { match: /стомат|dental|дандон/i, icon: "tooth" },
  { match: /дермат|skin|пост/i, icon: "skin" },
  { match: /лабор|lab|анализ/i, icon: "lab" },
  { match: /терап|табобат|therapy/i, icon: "default" },
];

export function resolveServiceIconName(name?: string | null): ServiceIconName {
  if (name && name in SERVICE_ICON_COLORS) {
    return name as ServiceIconName;
  }
  return "default";
}

/** Resolve icon from DB field or service title (for legacy rows without iconName). */
export function inferServiceIconName(
  iconName?: string | null,
  nameRu?: string | null,
  nameTj?: string | null
): ServiceIconName {
  const resolved = resolveServiceIconName(iconName);
  if (iconName && iconName in SERVICE_ICON_COLORS) {
    return resolved;
  }
  const text = `${nameRu ?? ""} ${nameTj ?? ""}`.trim();
  if (!text) return "default";
  for (const rule of ICON_NAME_RULES) {
    if (rule.match.test(text)) return rule.icon;
  }
  return "default";
}

export function getServiceIconPalette(
  iconName?: string | null,
  nameRu?: string | null,
  nameTj?: string | null
): ServiceIconPalette {
  return SERVICE_ICON_COLORS[inferServiceIconName(iconName, nameRu, nameTj)];
}
