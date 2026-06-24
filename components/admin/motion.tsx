"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.25, 0.1, 0.25, 1] as const;

export function MotionPage({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease }}
    >
      {children}
    </motion.div>
  );
}

export function MotionGrid({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function MotionItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ width: "100%", minWidth: 0 }}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.38, ease }}
    >
      {children}
    </motion.div>
  );
}

export function NavIndicator({ layoutId = "oa-nav-active" }: { layoutId?: string }) {
  return <motion.span layoutId={layoutId} className="oa-nav-indicator" transition={{ type: "spring", stiffness: 380, damping: 32 }} />;
}
