"use client";

import { useId } from "react";
import { motion } from "framer-motion";

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  const pillId = useId();

  return (
    <div className={`oa-segmented oa-segmented-gold ${className}`.trim()} role="tablist">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`oa-segmented-item ${active ? "oa-segmented-item-active" : ""}`}
            onClick={() => onChange(opt.id)}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                className="oa-segmented-indicator"
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
              />
            )}
            <span className="oa-segmented-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
