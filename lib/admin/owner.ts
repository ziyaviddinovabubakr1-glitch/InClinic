/** Display identity for the clinic owner in the admin shell. */
export const OWNER_NAME = "Абубакр";
export const OWNER_TITLE = "Владелец клиники";

export function ownerAvatarInitials(name = OWNER_NAME): string {
  const trimmed = name.trim();
  if (trimmed.length >= 2) return trimmed.slice(0, 2).toUpperCase();
  return trimmed[0]?.toUpperCase() ?? "—";
}
