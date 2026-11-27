import React, { useMemo, useState } from 'react';
import { localDayKey, localLogDate } from '../training';
import type { WorkoutLog } from '../types';

const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const weekdayNames = Array.from({ length: 7 }, (_, index) =>
  new Date(2024, 0, index + 1).toLocaleDateString(undefined, { weekday: 'short' }));

export default function WorkoutCalendar({ logs, day, onSelect }: {
  logs: WorkoutLog[];
  day: string | null;
  onSelect: (day: string | null) => void;
}) {
  const [month, setMonth] = useState(() => monthStart(logs.length ? localLogDate(logs[0].date) : new Date()));
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const log of logs) {
      const key = localDayKey(localLogDate(log.date));
      result.set(key, (result.get(key) ?? 0) + 1);
    }
    return result;
  }, [logs]);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const currentDay = localDayKey(new Date());

  function changeMonth(delta: number) {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    onSelect(null);
  }

  return (
    <section className="tracking-panel" aria-label="Workout calendar">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Workout calendar</h3>
          <p className="mt-1 text-sm text-text-secondary" aria-live="polite">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-1">
          <button type="button" className="icon-action" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <button type="button" className="icon-action" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
        {weekdayNames.map(name => <span key={name} className="pb-1 text-text-secondary">{name}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`pad-${index}`} />)}
        {Array.from({ length: days }, (_, index) => {
          const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
          const key = localDayKey(date);
          const count = counts.get(key) ?? 0;
          const label = date.toLocaleDateString(undefined, { dateStyle: 'long' });
          if (!count) return <span key={key} aria-current={key === currentDay ? 'date' : undefined}
            className="flex min-h-10 items-center justify-center rounded-lg text-text-secondary">{index + 1}</span>;
          return <button type="button" key={key} aria-pressed={day === key} aria-current={key === currentDay ? 'date' : undefined}
            aria-label={`${label}, ${count} ${count === 1 ? 'workout' : 'workouts'}`} onClick={() => onSelect(day === key ? null : key)}
            className={`flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-lg border tabular-nums text-brand-light ${day === key ? 'border-brand-primary bg-brand-primary/20' : 'border-transparent bg-brand-primary/10'}`}>
            {index + 1}<span className="h-1 w-1 rounded-full bg-brand-light" aria-hidden="true" />
          </button>;
        })}
      </div>
      {day && <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-text-secondary">Showing {localLogDate(day).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
        <button type="button" className="category-chip" onClick={() => onSelect(null)}>Show all dates</button>
      </div>}
    </section>
  );
}
