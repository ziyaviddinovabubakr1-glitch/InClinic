const STORAGE_KEY = "inclinic-owner-avatar";

export function getOwnerAvatarUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setOwnerAvatarUrl(dataUrl: string): void {
  localStorage.setItem(STORAGE_KEY, dataUrl);
  window.dispatchEvent(new Event("inclinic-owner-avatar-updated"));
}

export function clearOwnerAvatarUrl(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("inclinic-owner-avatar-updated"));
}
