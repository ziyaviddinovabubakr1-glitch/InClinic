"use client";

import type { SlotEntry } from "@/lib/slot-availability";

interface Labels {
  slotBooked: string;
  slotPast: string;
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

  return (
    <div className="bk-time">
      <div className="bk-time-head">
        <div className="bk-time-head-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7v5l3 2" />
          </svg>
        </div>
        <div>
          <div className="bk-time-head-title">{dateLabel}</div>
          <div className="bk-time-head-sub">
            {labels.workHours}: {workStart} – {workEnd}
          </div>
        </div>
      </div>

      <div className="bk-time-grid">
        {timeline.map((slot) => {
          const isAvailable = slot.status === "available";
          const isSelected = selectedTime === slot.time;
          return (
            <button
              key={slot.time}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelect(slot.time)}
              className={[
                "bk-time-slot",
                `bk-time-slot--${slot.status}`,
                isSelected ? "bk-time-slot--selected" : "",
              ].join(" ")}
            >
              <span className="bk-time-slot-time">{slot.time}</span>
              {slot.status === "booked" && (
                <span className="bk-time-slot-tag">{labels.slotBooked}</span>
              )}
              {slot.status === "past" && (
                <span className="bk-time-slot-tag">{labels.slotPast}</span>
              )}
              {slot.status === "booked" && (
                <span className="bk-time-slot-lock" aria-hidden>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
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
