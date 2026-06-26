export interface PatientCreateInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthDate?: string | null;
  gender?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface PatientUpdateInput extends Partial<PatientCreateInput> {}

export function validatePatientCreate(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (typeof body.firstName !== "string" || body.firstName.trim().length < 2) {
    errors.push("Имя должно содержать минимум 2 символа");
  }
  if (typeof body.lastName !== "string" || body.lastName.trim().length < 2) {
    errors.push("Фамилия должна содержать минимум 2 символа");
  }
  if (typeof body.phone !== "string" || body.phone.replace(/\D/g, "").length < 7) {
    errors.push("Некорректный номер телефона");
  }
  if (body.email !== undefined && body.email !== null && body.email !== "") {
    if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push("Некорректный email");
    }
  }
  if (body.birthDate !== undefined && body.birthDate !== null && body.birthDate !== "") {
    if (typeof body.birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate)) {
      errors.push("birthDate: формат YYYY-MM-DD");
    }
  }
  return errors;
}

export function validatePatientUpdate(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (body.firstName !== undefined) {
    if (typeof body.firstName !== "string" || body.firstName.trim().length < 2) {
      errors.push("Имя должно содержать минимум 2 символа");
    }
  }
  if (body.lastName !== undefined) {
    if (typeof body.lastName !== "string" || body.lastName.trim().length < 2) {
      errors.push("Фамилия должна содержать минимум 2 символа");
    }
  }
  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" || body.phone.replace(/\D/g, "").length < 7) {
      errors.push("Некорректный номер телефона");
    }
  }
  if (body.email !== undefined && body.email !== null && body.email !== "") {
    if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push("Некорректный email");
    }
  }
  return errors;
}
