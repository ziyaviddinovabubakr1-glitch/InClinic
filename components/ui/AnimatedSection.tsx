"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedSectionProps {
  children:   React.ReactNode;
  className?: string;
  delay?:     number;
  /** Scroll-in animation — use only for hero / key sections */
  animate?:   boolean;
  animation?: "fade-in-up" | "fade-in";
  threshold?: number;
}

const KEYFRAME: Record<string, string> = {
  "fade-in-up": "fadeInUp",
  "fade-in":    "fadeIn",
};

export default function AnimatedSection({
  children,
  className = "",
  delay     = 0,
  animate   = false,
  animation = "fade-in-up",
  threshold = 0.08,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const el = ref.current;
    if (!el) return;

    const fallback = setTimeout(() => setVisible(true), 400);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(fallback);
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -24px 0px" }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [animate, threshold]);

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  const keyframe = KEYFRAME[animation] ?? "fadeInUp";

  return (
    <div
      ref={ref}
      className={className}
      style={
        visible
          ? { animation: `${keyframe} 0.55s ease-out ${delay}ms both` }
          : { opacity: 0, transform: "translateY(12px)" }
      }
    >
      {children}
    </div>
  );
}
