"use client";

import { ReactNode, CSSProperties } from "react";

interface TiltCardProps {
  children:   ReactNode;
  className?: string;
  style?:     CSSProperties;
  /** Legacy props — ignored; cards are static for performance */
  intensity?: number;
  glowColor?: string;
  interactive?: boolean;
}

/** Static card wrapper — hover handled by `.glass-card` CSS (transform + opacity only). */
export default function TiltCard({
  children,
  className = "",
  style,
}: TiltCardProps) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
