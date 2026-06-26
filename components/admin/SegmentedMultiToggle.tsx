"use client";

import type { SegmentOption } from "./SegmentedControl";

export default function SegmentedMultiToggle<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SegmentOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  className?: string;
}) {
  function toggle(id: T) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className={`oa-segmented oa-segmented-gold oa-segmented-multi ${className}`.trim()} role="group">
      {options.map((opt) => {
        const active = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            className={`oa-segmented-item ${active ? "oa-segmented-item-active" : ""}`}
            onClick={() => toggle(opt.id)}
          >
            {active && <span className="oa-segmented-indicator oa-segmented-indicator-static" />}
            <span className="oa-segmented-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
