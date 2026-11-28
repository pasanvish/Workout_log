import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { muscleColor } from '../muscleGroups';
import { muscleDistribution, musclePeriodBounds, muscleTrend, muscleWork, type MusclePeriod } from '../trainingVolume';
import type { CustomExercise, WorkoutLog } from '../types';
import { BodyMuscleMap } from './BodyMuscleMap';

const periods: { id: MusclePeriod; label: string }[] = [
  { id: 'week', label: 'This week' },
  { id: 'last-week', label: 'Last week' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
  { id: 'all', label: 'All time' },
];

const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });
const shortDate = (value: number) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function MuscleDashboard({ logs, customExercises }: { logs: WorkoutLog[]; customExercises: CustomExercise[] }) {
  const [period, setPeriod] = useState<MusclePeriod>('30');
  const [selected, setSelected] = useState<string | null>(null);
  const work = useMemo(() => muscleWork(logs, customExercises), [logs, customExercises]);
  const { start, end } = musclePeriodBounds(period);
  const { groups, total } = useMemo(() => muscleDistribution(work, start, end), [work, start, end]);
  const focus = groups.find(group => group.name === selected);
  const trend = muscleTrend(work, focus?.name ?? null);
  const peak = Math.max(1, ...groups.map(group => group.sets));
  const counts = new Map(groups.map(group => [group.name, group.sets]));
  let current = 0;
  const distribution = groups.map(group => {
    const from = current;
    current += 100 * group.share / total;
    return `${muscleColor(group.name)} ${from}% ${Math.min(100, current)}%`;
  });
  const topExercises = focus ? [...focus.exercises].sort(([a, aCount], [b, bCount]) => bCount - aCount || a.localeCompare(b)).slice(0, 5) : [];

  return (
    <div className="space-y-4">
      <section className="tracking-panel">
        <h3 className="text-lg font-semibold">Muscle overview</h3>
        <div role="group" aria-label="Muscle chart date range" className="segmented-control mt-3">
          {periods.map(({ id, label }) => <button type="button" key={id} aria-pressed={period === id}
            className="!min-h-9 !text-xs leading-tight" onClick={() => setPeriod(id)}>{label}</button>)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="stat-card"><span className="text-xs text-text-secondary">Working sets</span>
            <strong className="mt-1 text-2xl tabular-nums text-brand-light">{total}</strong></div>
          <div className="stat-card"><span className="text-xs text-text-secondary">Muscle groups trained</span>
            <strong className="mt-1 text-2xl tabular-nums">{groups.filter(group => group.name !== 'Uncategorized').length}</strong></div>
        </div>
      </section>
      {total ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="tracking-panel">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Muscle map</h3>
              {focus && <button type="button" className="category-chip" onClick={() => setSelected(null)}>Show all groups</button>}
            </div>
            <div className="mt-4 rounded-xl bg-background-dark px-2 py-3">
              <BodyMuscleMap label={focus ? `${focus.name} on the muscle map` : 'Front and back working-set heatmap'} color={({ group }) => {
                const count = counts.get(group);
                if (!count || (focus && focus.name !== group)) return;
                if (focus) return muscleColor(group);
                return `rgba(128, 234, 207, ${0.2 + 0.8 * count / peak})`;
              }} />
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-secondary">
                {focus ? <><span className="size-2 rounded-full" style={{ backgroundColor: muscleColor(focus.name) }} /> {focus.name}</> : <>
                  Fewer sets <span className="h-2 w-12 rounded-full bg-gradient-to-r from-[#315456] to-[#80eacf]" /> More sets
                </>}
              </div>
            </div>
          </section>
          <section className="tracking-panel">
            <h3 className="text-lg font-semibold">Muscle distribution</h3>
            <p className="mt-1 text-xs text-text-secondary">Each set is split evenly across its primary muscle groups.</p>
            <div className="mx-auto my-4 grid aspect-square w-32 place-items-center rounded-full" aria-hidden="true"
              style={{ background: `conic-gradient(${distribution.join(', ')})` }}>
              <div className="grid size-24 place-content-center rounded-full bg-background-light text-center">
                <strong className="text-xl tabular-nums">{total}</strong><span className="text-xs text-text-secondary">sets</span>
              </div>
            </div>
            <ul className="space-y-1">
              {groups.map(group => <li key={group.name}>
                <button type="button" aria-pressed={focus?.name === group.name}
                  aria-label={`${group.name}, ${group.sets} target sets, ${percent.format(group.share / total)} of total volume`}
                  onClick={() => setSelected(focus?.name === group.name ? null : group.name)}
                  className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-background-dark aria-pressed:bg-brand-primary/15">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: muscleColor(group.name) }} aria-hidden="true" />
                  <span className="min-w-0 flex-1 break-words">
                    {group.name}<span className="ml-1.5 text-xs text-text-secondary">{group.sets} {group.sets === 1 ? 'set' : 'sets'}</span>
                  </span>
                  <strong className="tabular-nums">{percent.format(group.share / total)}</strong>
                </button>
              </li>)}
            </ul>
          </section>
        </div>
      ) : <p className="tracking-panel text-sm text-text-secondary">No working sets in this date range.</p>}
      {focus && <section className="tracking-panel">
        <h3 className="text-lg font-semibold">{focus.name} exercises</h3>
        <ul className="mt-3 space-y-1.5">
          {topExercises.map(([name, count]) => <li key={name} className="flex justify-between gap-2 rounded-lg bg-background-dark px-3 py-2 text-sm">
            <span className="break-words">{name}</span><strong className="shrink-0 tabular-nums">{count} {count === 1 ? 'set' : 'sets'}</strong>
          </li>)}
        </ul>
      </section>}
      <section className="tracking-panel">
        <h3 className="text-lg font-semibold">{focus ? `${focus.name} sets over time` : 'Working sets over time'}</h3>
        <p className="mt-1 text-xs text-text-secondary">Last 8 weeks · Monday to Sunday</p>
        {trend.some(point => point.sets) ? <div className="mt-4 h-48 min-w-0" role="img"
          aria-label={`Working sets by week. ${trend.map(point => `${shortDate(point.date)}: ${point.sets}`).join(' · ')}`}>
          <ResponsiveContainer>
            <BarChart data={trend} margin={{ top: 5, right: 4, bottom: 0, left: -8 }}>
              <CartesianGrid vertical={false} stroke="#2c3d49" strokeDasharray="3 4" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#9cafbc', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={13} />
              <YAxis width={40} allowDecimals={false} tick={{ fill: '#9cafbc', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={date => `Week of ${shortDate(Number(date))}`} cursor={{ fill: 'rgb(var(--brand-light) / .06)' }}
                contentStyle={{ background: '#121c24', borderColor: '#2c3d49', borderRadius: 12 }} />
              <Bar dataKey="sets" name="Working sets" fill={focus ? muscleColor(focus.name) : 'rgb(var(--brand-light))'}
                radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div> : <p className="mt-3 text-sm text-text-secondary">Log a working set to start the trend.</p>}
      </section>
    </div>
  );
}
