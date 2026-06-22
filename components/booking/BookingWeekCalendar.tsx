"use client";

import type { WeekDayEntry, DayStatus } from "@/lib/slot-availability";

interface Labels {
  weekPrev: string;
  weekNext: string;
  dayOff: string;
  dayFull: string;
  dayPast: string;
  slotsFree: string;
}

interface Props {
  days: WeekDayEntry[];
  weekStart: string;
  selectedDate: string;
  loading: boolean;
  labels: Labels;
  onSelect: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

function statusLabel(status: DayStatus, labels: Labels, availableCount: number): string | null {
  if (status === "off") return labels.dayOff;
  if (status === "full") return labels.dayFull;
  if (status === "past" || status === "unavailable") return labels.dayPast;
  if (status === "available" && availableCount > 0) return labels.slotsFree.replace("{n}", String(availableCount));
  return null;
}

function weekRangeLabel(weekStart: string): string {
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function BookingWeekCalendar({
  days,
  weekStart,
  selectedDate,
  loading,
  labels,
  onSelect,
  onPrevWeek,
  onNextWeek,
}: Props) {
  const selectable = (d: WeekDayEntry) => d.status === "available";

  return (
    <div className="bk-week">
      <div className="bk-week-head">
        <button type="button" className="bk-week-nav" onClick={onPrevWeek} aria-label={labels.weekPrev}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="bk-week-title">
          <span className="bk-week-title-main">{weekRangeLabel(weekStart)}</span>
        </div>
        <button type="button" className="bk-week-nav" onClick={onNextWeek} aria-label={labels.weekNext}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="bk-week-grid-wrap">
      <div className="bk-week-grid">
        {loading
          ? [...Array(7)].map((_, i) => <div key={i} className="bk-week-day bk-week-day--shimmer" />)
          : days.map((d) => {
              const canSelect = selectable(d);
              const isSelected = selectedDate === d.date;
              const badge = statusLabel(d.status, labels, d.availableCount);
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={!canSelect}
                  onClick={() => canSelect && onSelect(d.date)}
                  className={[
                    "bk-week-day",
                    `bk-week-day--${d.status}`,
                    isSelected ? "bk-week-day--selected" : "",
                  ].join(" ")}
                >
                  <span className="bk-week-day-name">{d.dayName}</span>
                  <span className="bk-week-day-num">{d.dayNum}</span>
                  <span className="bk-week-day-month">{d.monthShort}</span>
                  {badge && <span className="bk-week-day-badge">{badge}</span>}
                  {d.status === "full" && (
                    <span className="bk-week-day-lock" aria-hidden>
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
    </div>
  );
}
