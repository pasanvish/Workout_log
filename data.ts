import { isTrackingMode, recordCandidate, trackingOf } from './setTracking.ts';
import { cleanAppearance } from './profile.ts';
import type { WorkoutLog, ProfilePRs, CustomRoutine, CustomExercise, BodyMeasurementLog, ProfileAppearance } from './types';

const byDateDesc = (a: { date: string }, b: { date: string }) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

/** Rebuild records in chronological order so deletions and edits update historical flags. */
export function recomputePRs(logs: WorkoutLog[]): { logs: WorkoutLog[]; prs: ProfilePRs } {
  const prs: ProfilePRs = Object.create(null);
  const oldestFirst = [...logs].sort(byDateDesc).reverse().map(log => ({
    ...log,
    exercises: log.exercises.map(exercise => ({
      ...exercise,
      sets: exercise.sets.map(set => {
        const candidate = recordCandidate(set, trackingOf(exercise));
        if (!candidate || candidate.value <= (prs[exercise.name]?.[candidate.key]?.value ?? 0)) return { ...set, isPR: false };
        (prs[exercise.name] ??= Object.create(null))[candidate.key] = { value: candidate.value, date: log.date };
        return { ...set, isPR: true };
      }),
    })),
  }));
  return { logs: oldestFirst.reverse(), prs };
}

export interface Backup {
  app: 'gym-weight-logger';
  version: 3;
  exportedAt: string;
  profileName: string;
  profileAppearance?: ProfileAppearance;
  workoutLogs: WorkoutLog[];
  customRoutines: CustomRoutine[];
  customExercises: CustomExercise[];
  bodyMeasurements: BodyMeasurementLog[];
}

type Parsed = Pick<Backup, 'workoutLogs' | 'customRoutines' | 'customExercises' | 'bodyMeasurements' | 'profileAppearance'>;

const arr = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const validDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const numericText = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? String(value) : typeof value === 'string' ? value : '';

function parseLogs(value: unknown): WorkoutLog[] {
  return arr(value).flatMap(entry => {
    const log = record(entry);
    if (!text(log.id) || !validDate(log.date) || !text(log.routineName) || !Array.isArray(log.exercises)) return [];
    const exercises = log.exercises.flatMap(entry => {
      const exercise = record(entry);
      if (!text(exercise.name) || !Array.isArray(exercise.sets)) return [];
      const sets = exercise.sets.flatMap((entry, index) => {
        const set = record(entry);
        const weight = numericText(set.weight);
        const reps = numericText(set.reps);
        const seconds = numericText(set.seconds);
        return weight || reps || seconds ? [{ id: text(set.id) ? set.id : `set-${index}`, weight, reps, ...(seconds ? { seconds } : {}) }] : [];
      });
      return sets.length ? [{ name: exercise.name, sets, ...(isTrackingMode(exercise.tracking) ? { tracking: exercise.tracking } : {}) }] : [];
    });
    if (!exercises.length) return [];
    const effort = typeof log.effort === 'number' && Number.isInteger(log.effort) && log.effort >= 1 && log.effort <= 5
      ? log.effort : undefined;
    return [{ id: log.id, date: log.date, routineName: log.routineName, effort, exercises }];
  });
}

const bodyFields = ['weight', 'bodyFat', 'neck', 'shoulders', 'chest', 'biceps', 'waist', 'hips', 'thighs', 'calves'] as const;

/** Accepts Gym Logger backup files and older arrays of workout logs. */
export function parseBackup(data: unknown): Parsed | null {
  const obj = Array.isArray(data) ? { workoutLogs: data } : record(data);
  const parsed: Parsed = {
    workoutLogs: parseLogs(obj.workoutLogs),
    customRoutines: arr(obj.customRoutines).flatMap(entry => {
      const item = record(entry);
      if (!text(item.id) || !text(item.name) || !Array.isArray(item.exercises)) return [];
      const exercises = item.exercises.filter(text);
      return exercises.length ? [{ id: item.id, name: item.name, exercises }] : [];
    }),
    customExercises: arr(obj.customExercises).flatMap(entry => {
      const item = record(entry);
      return text(item.id) && text(item.name) && text(item.category) ? [{ id: item.id, name: item.name, category: item.category, ...(isTrackingMode(item.tracking) ? { tracking: item.tracking } : {}) }] : [];
    }),
    bodyMeasurements: arr(obj.bodyMeasurements).flatMap(entry => {
      const item = record(entry);
      if (!text(item.id) || !validDate(item.date)) return [];
      const log: BodyMeasurementLog = { id: item.id, date: item.date };
      for (const key of bodyFields) {
        const value = numericText(item[key]).trim();
        if (value && Number.isFinite(Number(value))) log[key] = value;
      }
      return [log];
    }),
  };
  const recognized = 'app' in obj && obj.app === 'gym-weight-logger' && 'version' in obj && (obj.version === 2 || obj.version === 3);
  if (recognized && 'profileAppearance' in obj) parsed.profileAppearance = cleanAppearance(obj.profileAppearance);
  const total = parsed.workoutLogs.length + parsed.customRoutines.length + parsed.customExercises.length + parsed.bodyMeasurements.length;
  const hasEmptyBackup = recognized && ['workoutLogs', 'customRoutines', 'customExercises', 'bodyMeasurements'].every(key =>
    Array.isArray(obj[key]) && obj[key].length === 0,
  );
  return total > 0 || hasEmptyBackup ? parsed : null;
}

/** Merge by id; existing entries win so an import never overwrites what's already on the device. */
export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map(item => item.id));
  const merged = [...existing];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
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
  assert(r.prs.Squat['5'].value === 100, 'best 5RM is 100');
  assert(r.logs.map(l => l.id).join() === 'c,b,a', 'newest first');
  assert(r.logs[2].exercises[0].sets[0].isPR && r.logs[1].exercises[0].sets[0].isPR, '80 then 100 are PRs');
  assert(!r.logs[0].exercises[0].sets[0].isPR, '90 after 100 is not a PR');
  r = recomputePRs(logs.filter(l => l.id !== 'b')); // delete the 100 session
  assert(r.prs.Squat['5'].value === 90 && r.logs[0].exercises[0].sets[0].isPR, 'PR falls back to 90');
  assert(mergeById([{ id: '1', v: 'old' }], [{ id: '1', v: 'new' }, { id: '2', v: 'x' }]).map(x => x.v).join() === 'old,x', 'merge keeps existing');
  assert(parseBackup([log('a', '2025-01-01', '80')])?.workoutLogs.length === 1, 'old array format');
  assert(parseBackup({ bodyMeasurements: [{ id: 'm', date: '2025-01-01' }] })?.bodyMeasurements.length === 1, 'new format');
  assert(parseBackup({ foo: 1 }) === null && parseBackup([{ nope: 1 }]) === null, 'junk rejected');
  const empty = { app: 'gym-weight-logger', version: 2, workoutLogs: [], customRoutines: [], customExercises: [], bodyMeasurements: [] };
  assert(parseBackup(empty) !== null, 'a clean profile backup can be restored');
  assert(parseBackup({ ...empty, workoutLogs: [{ ...log('a', '2025-01-01', '80'), exercises: [null] }] }) === null, 'malformed nested workouts are rejected');
  assert(mergeById([], [{ id: 'new' }, { id: 'new' }]).length === 1, 'duplicates inside an import are ignored');
  const mixed: WorkoutLog = {
    id: 'mixed', date: '2025-01-04', routineName: 'Mixed',
    exercises: [
      { name: 'Plank', tracking: 'duration', sets: [{ id: 'p', weight: '', reps: '', seconds: '45' }] },
      { name: 'Push-ups', tracking: 'bodyweight', sets: [{ id: 'b', weight: '', reps: '12' }, { id: 'w', weight: '5', reps: '12' }] },
    ],
  };
  const restored = parseBackup({ ...empty, version: 3, workoutLogs: [mixed] });
  assert(restored?.workoutLogs[0].exercises[0].sets[0].seconds === '45', 'duration survives backup import');
  const records = recomputePRs(restored!.workoutLogs).prs;
  assert(records.Plank.duration.value === 45, 'longest hold records duration');
  assert(records['Push-ups'].bodyweight.value === 12 && records['Push-ups']['added:12'].value === 5, 'bodyweight rep and added-load records stay separate');
  const legacyPlank = { ...mixed, id: 'legacy', exercises: [{ name: 'Plank', sets: [{ id: 'p', weight: '10', reps: '8' }] }] };
  const legacyRecords = recomputePRs([legacyPlank, mixed]).prs.Plank;
  assert(legacyRecords['8'].value === 10 && legacyRecords.duration.value === 45, 'legacy plank weights are not reassigned to seconds');
  console.log('data.ts: all checks passed');
}
