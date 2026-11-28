import type { CustomRoutine } from './types';

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = typeof WEEKDAYS[number];
export type WeeklyPlan = Partial<Record<Weekday, string>>;

export function cleanWeeklyPlan(value: unknown, routines?: CustomRoutine[]): WeeklyPlan {
  const plan: WeeklyPlan = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return plan;
  const source = value as Record<string, unknown>;
  const ids = routines && new Set(routines.map(routine => routine.id));
  for (const day of WEEKDAYS) {
    const id = source[day];
    if (Object.hasOwn(source, day) && typeof id === 'string' && id.trim() && (!ids || ids.has(id))) plan[day] = id;
  }
  return plan;
}

export function mergeWeeklyPlan(current: WeeklyPlan, incoming: WeeklyPlan, routines: CustomRoutine[]) {
  return { ...cleanWeeklyPlan(incoming, routines), ...cleanWeeklyPlan(current, routines) };
}

export function weekdayFor(date: Date): Weekday {
  return WEEKDAYS[(date.getDay() + 6) % 7];
}
