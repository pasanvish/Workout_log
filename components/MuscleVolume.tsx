import React, { useMemo, useState } from 'react';
import { weekStart } from '../training';
import { weeklyMuscleSets } from '../trainingVolume';
import type { CustomExercise, WorkoutLog } from '../types';

export default function MuscleVolume({ logs, customExercises }: { logs: WorkoutLog[]; customExercises: CustomExercise[] }) {
  const [offset, setOffset] = useState(0);
  const start = new Date();
  start.setDate(start.getDate() - offset * 7);
  const week = weekStart(start);
  const counts = useMemo(() => weeklyMuscleSets(logs, customExercises, week), [logs, customExercises, week]);
  const max = counts[0]?.[1] ?? 1;

  return (
    <section className="tracking-panel">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Weekly sets by muscle</h3>
          <p className="text-xs text-text-secondary">Working sets count toward each primary muscle group.</p>
        </div>
        <div className="segmented-control" role="group" aria-label="Muscle chart week">
          {['This week', 'Last week'].map((label, index) => <button key={label} type="button" className="!min-h-8 !px-2.5 !text-xs"
            aria-pressed={offset === index} onClick={() => setOffset(index)}>{label}</button>)}
        </div>
      </div>
      {counts.length ? <ul className="mt-4 space-y-2.5">
        {counts.map(([group, count]) => <li key={group} className="grid grid-cols-[minmax(6rem,1fr)_2fr_2ch] items-center gap-2 text-sm">
          <span className="break-words">{group}</span>
          <span aria-hidden="true" className="h-2 rounded-full bg-background-dark"><span className="block h-full rounded-full bg-brand-light"
            style={{ width: `${count * 100 / max}%` }} /></span>
          <strong className="text-right tabular-nums">{count}</strong>
        </li>)}
      </ul> : <p className="mt-4 rounded-xl bg-background-dark p-3 text-sm text-text-secondary">No working sets logged for this week.</p>}
    </section>
  );
}
