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
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="oa-modal-backdrop" onClick={onClose}>
      <div className="oa-modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="oa-modal-head">
          <div>
            <div className="oa-modal-title">{title}</div>
            {sub && <div className="oa-modal-sub">{sub}</div>}
          </div>
          <button className="oa-btn oa-btn-icon oa-btn-ghost" onClick={onClose} aria-label="Закрыть"><IClose /></button>
        </div>
        <div className="oa-modal-body">{children}</div>
        {footer && <div className="oa-modal-foot">{footer}</div>}
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
    <div className="oa-modal-backdrop oa-drawer-backdrop" onClick={onClose}>
      <div className="oa-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="oa-drawer-head">
          <div>
            <div className="oa-modal-title">{title}</div>
            {sub && <div className="oa-modal-sub">{sub}</div>}
          </div>
          <button className="oa-btn oa-btn-icon oa-btn-ghost" onClick={onClose} aria-label="Закрыть"><IClose /></button>
        </div>
        <div className="oa-drawer-body">{children}</div>
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
      <p style={{ fontSize: 13.5, color: "var(--oa-text-soft)", lineHeight: 1.55, margin: 0 }}>{message}</p>
    </Modal>
  );
}
