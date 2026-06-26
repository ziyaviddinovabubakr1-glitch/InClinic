const KEYS = {
  siteLogo: "inclinic-brand-site-logo",
  adminLogo: "inclinic-brand-admin-logo",
  favicon: "inclinic-brand-favicon",
} as const;

export type BrandAsset = keyof typeof KEYS;

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, dataUrl: string): void {
  localStorage.setItem(key, dataUrl);
  window.dispatchEvent(new Event("inclinic-brand-updated"));
}

function clear(key: string): void {
  localStorage.removeItem(key);
  window.dispatchEvent(new Event("inclinic-brand-updated"));
}

export function getBrandAsset(asset: BrandAsset): string | null {
  return read(KEYS[asset]);
}

export function setBrandAsset(asset: BrandAsset, dataUrl: string): void {
  write(KEYS[asset], dataUrl);
}

export function clearBrandAsset(asset: BrandAsset): void {
  clear(KEYS[asset]);
}

export function applyFaviconFromStorage(): void {
  if (typeof document === "undefined") return;
  const url = read(KEYS.favicon);
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-custom="1"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-custom", "1");
    document.head.appendChild(link);
  }
  link.href = url;
}
