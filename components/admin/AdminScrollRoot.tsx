"use client";

import { useEffect, useRef } from "react";

function isVerticallyScrollable(el: Element): boolean {
  const { overflowY } = window.getComputedStyle(el);
  if (overflowY !== "auto" && overflowY !== "scroll" && overflowY !== "overlay") {
    return false;
  }
  return el.scrollHeight > el.clientHeight + 1;
}

function findScrollableAncestor(start: Element | null, root: Element): Element | null {
  let node = start;
  while (node && node !== root) {
    if (isVerticallyScrollable(node)) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Fixed full-viewport scroll root for the admin panel.
 * Forwards wheel events when they land on non-scrollable children (sidebar, etc.)
 * because the public site locks `body { overflow: hidden }`.
 */
export default function AdminScrollRoot({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("admin-route");
    document.body.classList.add("admin-route");
    return () => {
      document.documentElement.classList.remove("admin-route");
      document.body.classList.remove("admin-route");
    };
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const onWheel = (e: WheelEvent) => {
      if (!root.contains(e.target as Node)) return;
      if (findScrollableAncestor(e.target as Element, root)) return;

      const max = root.scrollHeight - root.clientHeight;
      if (max <= 0) return;

      root.scrollTop = Math.max(0, Math.min(max, root.scrollTop + e.deltaY));
      e.preventDefault();
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={ref} className="owner-admin">
      {children}
    </div>
  );
}
