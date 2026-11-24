import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { WorkoutLog } from '../types';
import { completedSetCount, localLogDate, weekStart } from '../training';

type Metric = 'workouts' | 'sets';

const shortDate = (value: number) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function groupWeeks(logs: WorkoutLog[], currentWeek: number) {
  const weeks = new Map<number, { start: number; workouts: number; sets: number }>();
  for (let index = 7; index >= 0; index--) {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() - index * 7);
    const start = date.getTime();
    weeks.set(start, { start, workouts: 0, sets: 0 });
  }
  for (const log of logs) {
    const week = weeks.get(weekStart(localLogDate(log.date)));
    if (!week) continue;
    week.workouts += 1;
    week.sets += completedSetCount(log);
  }
  return [...weeks.values()];
}

export default function TrainingProgress({ logs }: { logs: WorkoutLog[] }) {
  const [metric, setMetric] = useState<Metric>('workouts');
  const currentWeek = weekStart(new Date());
  const weeks = useMemo(() => groupWeeks(logs, currentWeek), [logs, currentWeek]);
  const latest = weeks[weeks.length - 1][metric];
  const total = weeks.reduce((sum, week) => sum + week[metric], 0);
  const metricLabel = metric === 'workouts' ? 'Workouts' : 'Sets';

  return (
    <section className="tracking-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Weekly activity</h3>
          <p className="mt-1 text-xs text-text-secondary">Last 8 weeks · Monday to Sunday</p>
        </div>
        <div className="segmented-control" role="group" aria-label="Weekly chart metric">
          {(['workouts', 'sets'] as const).map(value => (
            <button key={value} type="button" className="!min-h-8 !px-2.5 !text-xs" aria-pressed={metric === value}
              onClick={() => setMetric(value)}>{value === 'workouts' ? 'Workouts' : 'Sets'}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="stat-card"><span className="text-xs text-text-secondary">This week</span><strong className="mt-1 text-xl tabular-nums text-brand-light">{latest}</strong></div>
        <div className="stat-card"><span className="text-xs text-text-secondary">8-week total</span><strong className="mt-1 text-xl tabular-nums">{total}</strong></div>
      </div>
      {total > 0 ? (
        <div className="mt-4 h-48 min-w-0" role="group" aria-label={`${metricLabel} by week`}>
          <ResponsiveContainer>
            <BarChart data={weeks} margin={{ top: 5, right: 4, bottom: 0, left: -8 }}>
              <CartesianGrid vertical={false} stroke="#2c3d49" strokeDasharray="3 4" />
              <XAxis dataKey="start" tickFormatter={shortDate} tick={{ fill: '#9cafbc', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={13} />
              <YAxis width={40} allowDecimals={false} tick={{ fill: '#9cafbc', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={start => `Week of ${shortDate(Number(start))}`} cursor={{ fill: 'rgb(var(--brand-light) / .06)' }}
                contentStyle={{ background: '#121c24', borderColor: '#2c3d49', borderRadius: 12 }} />
              <Bar dataKey={metric} name={metricLabel} fill="rgb(var(--brand-light))" radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-background-dark p-3 text-sm text-text-secondary">{metricLabel} logged within the past 8 weeks will appear here.</p>
      )}
    </section>
  );
}
