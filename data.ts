import type { WorkoutLog, ProfilePRs, CustomRoutine, CustomExercise, BodyMeasurementLog } from './types';

const byDateDesc = (a: { date: string }, b: { date: string }) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

/** Rebuild PRs (best weight per exercise per rep count) and each set's isPR flag from scratch. */
export function recomputePRs(logs: WorkoutLog[]): { logs: WorkoutLog[]; prs: ProfilePRs } {
  const prs: ProfilePRs = {};
  const oldestFirst = [...logs].sort(byDateDesc).reverse().map(log => ({
    ...log,
    exercises: log.exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(set => {
        const weight = parseFloat(set.weight);
        const reps = parseInt(set.reps, 10);
        if (!(weight > 0 && reps > 0)) return { ...set, isPR: false };
        const best = prs[ex.name]?.[reps]?.weight ?? 0;
        if (weight <= best) return { ...set, isPR: false };
        (prs[ex.name] ??= {})[reps] = { weight, date: log.date };
        return { ...set, isPR: true };
      }),
    })),
  }));
  return { logs: oldestFirst.reverse(), prs };
}

export interface Backup {
  app: 'gym-weight-logger';
  version: 2;
  exportedAt: string;
  profileName: string;
  workoutLogs: WorkoutLog[];
  customRoutines: CustomRoutine[];
  customExercises: CustomExercise[];
  bodyMeasurements: BodyMeasurementLog[];
}

type Parsed = Pick<Backup, 'workoutLogs' | 'customRoutines' | 'customExercises' | 'bodyMeasurements'>;

const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const isLog = (l: any): l is WorkoutLog =>
  l && typeof l.id === 'string' && !isNaN(new Date(l.date).getTime()) && Array.isArray(l.exercises);
const hasId = (x: any) => x && typeof x.id === 'string';

/** Accepts the new full backup object or the old plain array of workout logs. Returns null if unusable. */
export function parseBackup(data: unknown): Parsed | null {
  const obj: any = Array.isArray(data) ? { workoutLogs: data } : data;
  if (!obj || typeof obj !== 'object') return null;
  const parsed: Parsed = {
    workoutLogs: arr(obj.workoutLogs).filter(isLog),
    customRoutines: arr(obj.customRoutines).filter(hasId),
    customExercises: arr(obj.customExercises).filter(hasId),
    bodyMeasurements: arr(obj.bodyMeasurements).filter(hasId),
  };
  const total = Object.values(parsed).reduce((n, a) => n + a.length, 0);
  return total > 0 ? parsed : null;
}

/** Merge by id; existing entries win so an import never overwrites what's already on the device. */
export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map(x => x.id));
  return [...existing, ...incoming.filter(x => !seen.has(x.id))];
}

export const sortByDateDesc = <T extends { date: string }>(items: T[]) => [...items].sort(byDateDesc);

// Self-check: node data.ts
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('data.ts')) {
  const assert = (c: unknown, m: string) => { if (!c) throw new Error(m); };
  const log = (id: string, date: string, weight: string, reps = '5'): WorkoutLog => ({
    id, date, routineName: 'R', exercises: [{ name: 'Squat', sets: [{ id: 's', weight, reps }] }],
  });
  const logs = [log('c', '2025-01-03', '90'), log('a', '2025-01-01', '80'), log('b', '2025-01-02', '100')];
  let r = recomputePRs(logs);
  assert(r.prs.Squat['5'].weight === 100, 'best 5RM is 100');
  assert(r.logs.map(l => l.id).join() === 'c,b,a', 'newest first');
  assert(r.logs[2].exercises[0].sets[0].isPR && r.logs[1].exercises[0].sets[0].isPR, '80 then 100 are PRs');
  assert(!r.logs[0].exercises[0].sets[0].isPR, '90 after 100 is not a PR');
  r = recomputePRs(logs.filter(l => l.id !== 'b')); // delete the 100 session
  assert(r.prs.Squat['5'].weight === 90 && r.logs[0].exercises[0].sets[0].isPR, 'PR falls back to 90');
  assert(mergeById([{ id: '1', v: 'old' }], [{ id: '1', v: 'new' }, { id: '2', v: 'x' }]).map(x => x.v).join() === 'old,x', 'merge keeps existing');
  assert(parseBackup([log('a', '2025-01-01', '80')])?.workoutLogs.length === 1, 'old array format');
  assert(parseBackup({ bodyMeasurements: [{ id: 'm', date: '2025-01-01' }] })?.bodyMeasurements.length === 1, 'new format');
  assert(parseBackup({ foo: 1 }) === null && parseBackup([{ nope: 1 }]) === null, 'junk rejected');
  console.log('data.ts: all checks passed');
}
