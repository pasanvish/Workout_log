import { getExerciseDetails } from './exerciseDetails.ts';
import { muscleGroupFor } from './muscleGroups.ts';
import { isCompleteSet, trackingOf } from './setTracking.ts';
import { localLogDate, weekStart } from './training.ts';
import type { CustomExercise, WorkoutLog } from './types';

interface MuscleWork {
  date: number;
  exercise: string;
  groups: string[];
  sets: number;
}

export function muscleWork(logs: WorkoutLog[], customExercises: CustomExercise[]): MuscleWork[] {
  const customs = new Map(customExercises.map(({ name, category }) => [name, category]));
  return logs.flatMap(log => {
    const date = localLogDate(log.date).getTime();
    if (!Number.isFinite(date)) return [];
    return log.exercises.flatMap(exercise => {
      const details = getExerciseDetails(exercise.name);
      const customCategory = customs.get(exercise.name);
      if (details.category === 'Mobility' || (!details.reference && customCategory === 'Mobility')) return [];
      const mode = trackingOf(exercise);
      const sets = exercise.sets.filter(set => set.setType !== 'warmup' && isCompleteSet(set, mode)).length;
      if (!sets) return [];
      const targets = details.reference?.primaryMuscles.map(muscleGroupFor) ?? [customCategory ? muscleGroupFor(customCategory) : 'Uncategorized'];
      const groups = [...new Set(targets)];
      return [{ date, exercise: exercise.name, groups: groups.length ? groups : ['Uncategorized'], sets }];
    });
  });
}

export type MusclePeriod = 'week' | 'last-week' | '30' | '90' | 'all';

export function musclePeriodBounds(period: MusclePeriod, now = new Date()) {
  const start = new Date(weekStart(now));
  if (period === 'all') return { start: -Infinity, end: Infinity };
  if (period === 'week') {
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start: start.getTime(), end: end.getTime() };
  }
  if (period === 'last-week') {
    const end = start.getTime();
    start.setDate(start.getDate() - 7);
    return { start: start.getTime(), end };
  }
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  const beginning = new Date(end);
  beginning.setDate(end.getDate() - Number(period));
  return { start: beginning.getTime(), end: end.getTime() };
}

export function muscleDistribution(work: MuscleWork[], start: number, end: number) {
  const groups = new Map<string, { name: string; sets: number; share: number; exercises: Map<string, number> }>();
  let total = 0;
  for (const entry of work) {
    if (entry.date < start || entry.date >= end) continue;
    total += entry.sets;
    for (const name of entry.groups) {
      const group = groups.get(name) ?? { name, sets: 0, share: 0, exercises: new Map() };
      group.sets += entry.sets;
      group.share += entry.sets / entry.groups.length;
      group.exercises.set(entry.exercise, (group.exercises.get(entry.exercise) ?? 0) + entry.sets);
      groups.set(name, group);
    }
  }
  return {
    total,
    groups: [...groups.values()].sort((a, b) => b.share - a.share || a.name.localeCompare(b.name)),
  };
}

export function muscleTrend(work: MuscleWork[], group: string | null, now = new Date()) {
  const current = new Date(weekStart(now));
  const weeks = new Map<number, number>();
  for (let index = 7; index >= 0; index--) {
    const date = new Date(current);
    date.setDate(current.getDate() - index * 7);
    weeks.set(date.getTime(), 0);
  }
  for (const entry of work) {
    if (group && !entry.groups.includes(group)) continue;
    const week = weekStart(new Date(entry.date));
    if (weeks.has(week)) weeks.set(week, (weeks.get(week) ?? 0) + entry.sets);
  }
  return [...weeks].map(([date, sets]) => ({ date, sets }));
}

export function weeklyMuscleSets(logs: WorkoutLog[], customExercises: CustomExercise[], start: number) {
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return muscleDistribution(muscleWork(logs, customExercises), start, end.getTime()).groups
    .map(({ name, sets }) => [name, sets] as const)
    .sort(([a, first], [b, second]) => second - first || a.localeCompare(b));
}
