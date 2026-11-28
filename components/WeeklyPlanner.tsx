import React, { useState } from 'react';
import { weekStart } from '../training';
import { cleanWeeklyPlan, WEEKDAYS, weekdayFor, type Weekday, type WeeklyPlan } from '../weeklyPlan';
import type { CustomRoutine } from '../types';
import ModalFrame from './ModalFrame';

const shortDay = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const longDay = new Intl.DateTimeFormat(undefined, { weekday: 'long' });

interface WeeklyPlannerProps {
  plan: WeeklyPlan;
  routines: CustomRoutine[];
  onSave: (plan: WeeklyPlan) => void;
  onStart: (routine: CustomRoutine) => void;
}

export default function WeeklyPlanner({ plan, routines, onSave, onStart }: WeeklyPlannerProps) {
  const now = new Date();
  const today = weekdayFor(now);
  const [chosenDay, setChosenDay] = useState<Weekday>();
  const [draft, setDraft] = useState<WeeklyPlan | null>(null);
  const selected = chosenDay ?? today;
  const start = new Date(weekStart(now));
  const dates = WEEKDAYS.map((day, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { day, date, routine: routines.find(routine => routine.id === plan[day]) };
  });
  const selectedDate = dates.find(item => item.day === selected)!;

  return (
    <section className="tracking-panel space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Weekly plan</h3>
        {routines.length > 0 && <button type="button" className="panel-action" onClick={() => setDraft(cleanWeeklyPlan(plan, routines))}>
          Edit plan
        </button>}
      </div>
      <div role="group" aria-label="Days in your weekly plan" className="grid grid-cols-7 gap-1">
        {dates.map(({ day, date, routine }) => <button type="button" key={day} aria-pressed={day === selected}
          aria-current={day === today ? 'date' : undefined} onClick={() => setChosenDay(day)}
          aria-label={`${longDay.format(date)} ${date.getDate()}, ${routine?.name ?? 'no routine scheduled'}`}
          className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg border border-border-color/60 bg-background-dark py-2 text-xs
            text-text-secondary hover:border-brand-primary aria-pressed:border-brand-primary/60 aria-pressed:bg-brand-primary/15 aria-pressed:text-brand-light">
          <span className="truncate max-w-full">{shortDay.format(date)}</span><strong className="text-sm tabular-nums">{date.getDate()}</strong>
          <span aria-hidden="true" className={`size-1 rounded-full ${routine ? 'bg-brand-light' : 'bg-transparent'}`} />
        </button>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background-dark p-3">
        <div className="min-w-0">
          <p className="text-xs text-text-secondary">{selected === today ? 'Today' : longDay.format(selectedDate.date)}</p>
          <strong className="block break-words text-base">{selectedDate.routine?.name ?? 'No routine scheduled'}</strong>
          {!routines.length && <p className="text-xs text-text-secondary">Create a routine below to plan your workouts.</p>}
        </div>
        {selectedDate.routine && <button type="button" className="panel-action panel-action-primary"
          onClick={() => onStart(selectedDate.routine!)}>Start workout</button>}
      </div>
      {draft && <ModalFrame title="Edit weekly plan" onClose={() => setDraft(null)} footer={
        <button type="submit" form="weekly-plan-form" className="panel-action panel-action-primary">Save plan</button>
      }>
        <form id="weekly-plan-form" className="space-y-3" onSubmit={event => {
          event.preventDefault();
          onSave(cleanWeeklyPlan(draft, routines));
          setDraft(null);
        }}>
          {dates.map(({ day, date }) => <label key={day} className="block text-sm font-semibold">
            {longDay.format(date)}
            <select className="track-input mt-1 w-full" value={draft[day] ?? ''}
              onChange={event => setDraft(current => ({ ...current, [day]: event.target.value || undefined }))}>
              <option value="">Rest day</option>
              {routines.map(routine => <option key={routine.id} value={routine.id}>{routine.name}</option>)}
            </select>
          </label>)}
        </form>
      </ModalFrame>}
    </section>
  );
}
