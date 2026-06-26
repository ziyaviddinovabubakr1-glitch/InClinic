"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.4, 0, 0.2, 1] as const;

export function MotionPage({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease }}
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
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08, margin: "0px 0px -24px 0px" }}
      transition={{ duration: 0.24, ease }}
    >
      {children}
    </motion.div>
  );
}

export function NavIndicator({ layoutId = "oa-nav-active" }: { layoutId?: string }) {
  return (
    <motion.span
      layoutId={layoutId}
      className="oa-nav-indicator"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    />
  );
}

export function StaggerGrid({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ width: "100%", minWidth: 0, height: "100%", display: "flex", flexDirection: "column" }}
      variants={
        reduce
          ? undefined
          : {
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.28, ease } },
            }
      }
    >
      {children}
    </motion.div>
  );
}
