const STORAGE_KEY = "inclinic-doctor-creds";

type CredMap = Record<string, string>;

function load(): CredMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CredMap) : {};
  } catch {
    return {};
  }
}

function save(map: CredMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function normalizeDoctorPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function setDoctorCredentials(phone: string, password: string): void {
  const map = load();
  map[normalizeDoctorPhone(phone)] = password;
  save(map);
}

export function verifyDoctorCredentials(phone: string, password: string): boolean {
  const key = normalizeDoctorPhone(phone);
  const map = load();
  return map[key] === password;
}

export function removeDoctorCredentials(phone: string): void {
  const map = load();
  delete map[normalizeDoctorPhone(phone)];
  save(map);
}

const DEFAULT_PASSWORD = "doctor123";

/** Пароль по умолчанию для демо-врачей из mock-данных. */
export function ensureDoctorCredentialsSeeded(phones: string[]): void {
  const map = load();
  let changed = false;
  for (const phone of phones) {
    const key = normalizeDoctorPhone(phone);
    if (!map[key]) {
      map[key] = DEFAULT_PASSWORD;
      changed = true;
    }
  }
  if (changed) save(map);
}

export function getDefaultDoctorPasswordHint(): string {
  return DEFAULT_PASSWORD;
}
