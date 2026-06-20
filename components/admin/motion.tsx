"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.25, 0.1, 0.25, 1] as const;

export function MotionPage({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease }}
    >
      {children}
    </motion.div>
  );
}

export function MotionGrid({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function NavIndicator({ layoutId = "oa-nav-active" }: { layoutId?: string }) {
  return <motion.span layoutId={layoutId} className="oa-nav-indicator" transition={{ type: "spring", stiffness: 380, damping: 32 }} />;
}
