"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type ToastTone = "info" | "success" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toasts: ToastItem[];
  pushToast: (input: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((input: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { ...input, id }]);
    setTimeout(() => dismissToast(id), 6000);
  }, [dismissToast]);

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="oa-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`oa-toast oa-toast--${t.tone}`}>
            <div className="oa-toast-body">
              <div className="oa-toast-title">{t.title}</div>
              {t.message && <div className="oa-toast-msg">{t.message}</div>}
            </div>
            <button
              type="button"
              className="oa-toast-close"
              onClick={() => dismissToast(t.id)}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      pushToast: () => {},
      dismissToast: () => {},
      toasts: [] as ToastItem[],
    };
  }
  return ctx;
}
