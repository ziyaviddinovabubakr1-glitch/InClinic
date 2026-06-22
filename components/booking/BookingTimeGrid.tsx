"use client";

import type { SlotEntry } from "@/lib/slot-availability";

interface Labels {
  slotBooked: string;
  slotPast: string;
  slotAvailable: string;
  pickTime: string;
  workHours: string;
}

interface Props {
  timeline: SlotEntry[];
  selectedTime: string;
  loading: boolean;
  workStart: string;
  workEnd: string;
  dateLabel: string;
  labels: Labels;
  onSelect: (time: string) => void;
}

export default function BookingTimeGrid({
  timeline,
  selectedTime,
  loading,
  workStart,
  workEnd,
  dateLabel,
  labels,
  onSelect,
}: Props) {
  if (loading) {
    return (
      <div className="bk-time">
        <div className="bk-time-head">
          <div className="h-5 w-40 rounded-lg shimmer" />
        </div>
        <div className="bk-time-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bk-time-slot bk-time-slot--shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return null;
  }

  const bookedCount = timeline.filter((s) => s.status === "booked").length;
  const freeCount = timeline.filter((s) => s.status === "available").length;

  return (
    <div className="bk-time">
      <div className="bk-time-head">
        <div className="bk-time-head-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bk-time-head-title">{dateLabel}</div>
          <div className="bk-time-head-sub">
            {labels.workHours}: {workStart} – {workEnd}
            {freeCount > 0 && (
              <span className="bk-time-head-count"> · {freeCount} {labels.slotAvailable.toLowerCase()}</span>
            )}
          </div>
        </div>
      </div>

      <div className="bk-time-legend" role="list" aria-label="Легенда слотов">
        <span className="bk-time-legend-item bk-time-legend-item--free" role="listitem">
          <span className="bk-time-legend-dot" /> {labels.slotAvailable}
        </span>
        <span className="bk-time-legend-item bk-time-legend-item--busy" role="listitem">
          <span className="bk-time-legend-dot" /> {labels.slotBooked}
        </span>
        <span className="bk-time-legend-item bk-time-legend-item--past" role="listitem">
          <span className="bk-time-legend-dot" /> {labels.slotPast}
        </span>
      </div>

      {bookedCount > 0 && (
        <p className="bk-time-hint">{labels.slotBooked} — {bookedCount}</p>
      )}

      <div className="bk-time-grid">
        {timeline.map((slot) => {
          const isAvailable = slot.status === "available";
          const isSelected = selectedTime === slot.time;
          const isBooked = slot.status === "booked";
          const isPast = slot.status === "past";

          let ariaLabel = `${slot.time}`;
          if (isBooked) ariaLabel += `, ${labels.slotBooked}`;
          else if (isPast) ariaLabel += `, ${labels.slotPast}`;
          else ariaLabel += `, ${labels.slotAvailable}`;

          return (
            <button
              key={slot.time}
              type="button"
              disabled={!isAvailable}
              aria-label={ariaLabel}
              aria-pressed={isSelected}
              onClick={() => isAvailable && onSelect(slot.time)}
              className={[
                "bk-time-slot",
                `bk-time-slot--${slot.status}`,
                isSelected ? "bk-time-slot--selected" : "",
              ].join(" ")}
            >
              <span className="bk-time-slot-time">{slot.time}</span>
              {isBooked && (
                <span className="bk-time-slot-tag bk-time-slot-tag--booked">{labels.slotBooked}</span>
              )}
              {isPast && (
                <span className="bk-time-slot-tag bk-time-slot-tag--past">{labels.slotPast}</span>
              )}
              {isAvailable && !isSelected && (
                <span className="bk-time-slot-tag bk-time-slot-tag--free">{labels.slotAvailable}</span>
              )}
              {isBooked && (
                <span className="bk-time-slot-lock" aria-hidden>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V12a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 016 0v3H9z" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
