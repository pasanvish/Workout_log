import { isCompleteSet, trackingOf } from './setTracking.ts';
import type { WorkoutLog } from './types';

export function localLogDate(value: string) {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
}

export function weekStart(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return date.getTime();
}

export function completedSetCount(log: WorkoutLog) {
  return log.exercises.reduce((count, exercise) =>
    count + exercise.sets.filter(set => isCompleteSet(set, trackingOf(exercise))).length, 0);
}

export function longestTrainingStreak(logs: WorkoutLog[]) {
  const weeks = [...new Set(logs.map(log => weekStart(localLogDate(log.date))).filter(Number.isFinite))].sort((a, b) => a - b);
  let best = 0;
  let streak = 0;
  let previous = NaN;
  for (const week of weeks) {
    const precedingWeek = new Date(week);
    precedingWeek.setDate(precedingWeek.getDate() - 7);
    streak = precedingWeek.getTime() === previous ? streak + 1 : 1;
    best = Math.max(best, streak);
    previous = week;
  }
  return best;
}
