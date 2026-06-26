"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="oa-card oa-card-pad" style={{ maxWidth: 480, margin: "48px auto", textAlign: "center" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Ошибка панели</h2>
      <p style={{ fontSize: 14, color: "var(--oa-text-soft)", marginBottom: 20 }}>
        {error.message || "Не удалось загрузить страницу. Попробуйте обновить."}
      </p>
      <button type="button" className="oa-btn oa-btn-primary" onClick={reset}>
        Повторить
      </button>
    </div>
  );
}
