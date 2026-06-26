export function validateReviewCreate(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (typeof body.bookingId !== "string" || !body.bookingId.trim()) {
    errors.push("bookingId обязателен");
  }
  const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Рейтинг должен быть от 1 до 5");
  }
  return errors;
}

export function validateReviewPatch(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (body.status !== undefined) {
    const s = String(body.status);
    if (!["PENDING", "APPROVED", "REJECTED"].includes(s)) {
      errors.push("Некорректный status");
    }
  }
  if (body.rating !== undefined) {
    const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push("Рейтинг должен быть от 1 до 5");
    }
  }
  if (
    body.status === undefined &&
    body.rating === undefined &&
    body.comment === undefined
  ) {
    errors.push("Нет полей для обновления");
  }
  return errors;
}
