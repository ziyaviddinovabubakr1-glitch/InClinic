"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { IClose } from "./icons";

export function Modal({
  open, onClose, title, sub, children, footer, maxWidth = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="oa-modal-backdrop" onClick={onClose}>
      <div className="oa-modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 22px 14px", borderBottom: "1px solid var(--oa-border)" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: "-0.01em" }}>{title}</div>
            {sub && <div style={{ fontSize: 12.5, color: "var(--oa-text-faint)", marginTop: 2 }}>{sub}</div>}
          </div>
          <button className="oa-btn oa-btn-icon oa-btn-ghost" onClick={onClose} aria-label="Закрыть"><IClose /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
        {footer && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: "1px solid var(--oa-border)", background: "var(--oa-surface-2)", borderRadius: "0 0 20px 20px" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Drawer({
  open, onClose, title, sub, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="oa-modal-backdrop" style={{ justifyContent: "flex-end", padding: 0 }} onClick={onClose}>
      <div className="oa-drawer" onClick={(e) => e.stopPropagation()}>
        <div style={{ position: "sticky", top: 0, background: "var(--oa-surface)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 22px 16px", borderBottom: "1px solid var(--oa-border)", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: "-0.01em" }}>{title}</div>
            {sub && <div style={{ fontSize: 12.5, color: "var(--oa-text-faint)", marginTop: 2 }}>{sub}</div>}
          </div>
          <button className="oa-btn oa-btn-icon oa-btn-ghost" onClick={onClose} aria-label="Закрыть"><IClose /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = "Удалить", danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={420}
      footer={
        <>
          <button className="oa-btn oa-btn-ghost" onClick={onClose}>Отмена</button>
          <button className={`oa-btn ${danger ? "oa-btn-danger" : "oa-btn-primary"}`} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </button>
        </>
      }>
      <p style={{ fontSize: 13.5, color: "var(--oa-text-soft)", lineHeight: 1.55 }}>{message}</p>
    </Modal>
  );
}
