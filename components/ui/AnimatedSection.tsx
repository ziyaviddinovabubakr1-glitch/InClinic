"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedSectionProps {
  children:   React.ReactNode;
  className?: string;
  delay?:     number;
  animation?: "fade-in-up" | "fade-in" | "scale-in";
  threshold?: number;
}

const KEYFRAME: Record<string, string> = {
  "fade-in-up": "fadeInUp",
  "fade-in":    "fadeIn",
  "scale-in":   "scaleIn",
};
const DURATION: Record<string, string> = {
  "fade-in-up": "0.65s",
  "fade-in":    "0.5s",
  "scale-in":   "0.45s",
};

export default function AnimatedSection({
  children,
  className = "",
  delay     = 0,
  animation = "fade-in-up",
  threshold = 0.01,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  // "idle"     = SSR / pre-mount  → content fully visible (no JS needed)
  // "waiting"  = JS loaded, not yet in view → opacity 0
  // "animated" = in view or fallback fired   → play animation
  const [state, setState] = useState<"idle" | "waiting" | "animated">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Transition to "waiting" only after mount so SSR always shows content
    setState("waiting");

    // Fallback: show after 500 ms regardless of scroll position
    const fallback = setTimeout(() => setState("animated"), 500);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(fallback);
          setState("animated");
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold]);

  const keyframe = KEYFRAME[animation] ?? "fadeInUp";
  const dur      = DURATION[animation]  ?? "0.65s";

  return (
    <div
      ref={ref}
      className={className}
      style={
        state === "idle"     ? {}                                                                // visible, no style
          : state === "waiting"  ? { opacity: 0, willChange: "opacity, transform" }            // briefly hidden
          : { animation: `${keyframe} ${dur} ease-out ${delay}ms both` }                       // play anim
      }
    >
      {children}
    </div>
  );
}
