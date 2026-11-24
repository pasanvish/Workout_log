import type { CustomExercise, Exercise, Set, TrackingMode } from './types';

export const TRACKING_LABELS: Record<TrackingMode, string> = {
  weight: 'Weight & reps',
  bodyweight: 'Bodyweight & reps',
  duration: 'Duration',
};

const bodyweightExercises = new Set([
  'Push-ups', 'Pull-ups', 'Chin-ups', 'Triceps Dips', 'Crunches', 'Leg Raises',
  'Russian Twist', 'Back Extension (Hyperextension)',
]);

export function isTrackingMode(value: unknown): value is TrackingMode {
  return value === 'weight' || value === 'bodyweight' || value === 'duration';
}

export function defaultTracking(name: string, customExercises: CustomExercise[]): TrackingMode {
  const custom = customExercises.find(exercise => exercise.name === name)?.tracking;
  if (isTrackingMode(custom)) return custom;
  if (name === 'Plank') return 'duration';
  return bodyweightExercises.has(name) ? 'bodyweight' : 'weight';
}

/** Older saved sessions used weight and reps for every exercise. Preserve those units. */
export function trackingOf(exercise: Exercise): TrackingMode {
  return isTrackingMode(exercise.tracking) ? exercise.tracking : 'weight';
}

export const newSetId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const emptySet = (): Set => ({ id: newSetId(), weight: '', reps: '', seconds: '' });
export type SetField = 'weight' | 'reps' | 'seconds';

export function cleanSetInput(field: SetField, value: string) {
  if (field !== 'weight') return value.replace(/\D/g, '');
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const [integer, ...decimal] = normalized.split('.');
  return decimal.length ? `${integer}.${decimal.join('')}` : integer;
}

function positiveInteger(value?: string) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0;
}

export function isCompleteSet(set: Set, mode: TrackingMode) {
  if (mode === 'duration') return positiveInteger(set.seconds);
  if (!positiveInteger(set.reps)) return false;
  const input = String(set.weight ?? '').trim();
  if (mode === 'bodyweight' && !input) return true;
  const weight = Number(input);
  return Boolean(input) && Number.isFinite(weight) && weight >= 0;
}

export function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const remainder = whole % 60;
  return mins ? `${mins}m ${String(remainder).padStart(2, '0')}s` : `${remainder}s`;
}

export function formatSet(set: Set, mode: TrackingMode) {
  if (mode === 'duration') return set.seconds ? formatDuration(Number(set.seconds)) : '—';
  const reps = `${set.reps || '—'} ${set.reps === '1' ? 'rep' : 'reps'}`;
  if (mode === 'bodyweight') return Number(set.weight) > 0 ? `BW + ${set.weight} kg × ${reps}` : `BW × ${reps}`;
  return `${set.weight || '—'} kg × ${reps}`;
}

export function recordCandidate(set: Set, mode: TrackingMode): { key: string; value: number } | undefined {
  if (!isCompleteSet(set, mode)) return undefined;
  if (mode === 'duration') return { key: 'duration', value: Number(set.seconds) };
  const weight = Number(set.weight);
  const reps = Number(set.reps);
  if (mode === 'bodyweight') return weight > 0 ? { key: `added:${reps}`, value: weight } : { key: 'bodyweight', value: reps };
  return weight > 0 ? { key: String(reps), value: weight } : undefined;
}

export function formatRecord(key: string, value: number) {
  if (key === 'duration') return { label: 'Longest hold', value: formatDuration(value) };
  if (key === 'bodyweight') return { label: 'Most bodyweight reps', value: `${value} ${value === 1 ? 'rep' : 'reps'}` };
  const [kind, count] = key.split(':');
  const reps = count ?? kind;
  return { label: `${reps} ${reps === '1' ? 'rep' : 'reps'}`, value: `${count ? '+' : ''}${value} kg` };
}

export type ProgressMetric = 'weight' | 'added' | 'bodyweight' | 'duration';

export const PROGRESS_METRICS: Record<ProgressMetric, { label: string; description: string; sample: (value: number) => string }> = {
  weight: { label: 'Weight', description: 'Heaviest set for each session.', sample: value => `${value} kg` },
  added: { label: 'Added weight', description: 'Most weight added to bodyweight in each session.', sample: value => `+${value} kg` },
  bodyweight: { label: 'Bodyweight reps', description: 'Most unweighted reps in one set for each session.', sample: value => `${value} reps` },
  duration: { label: 'Duration', description: 'Longest hold for each session.', sample: formatDuration },
};

export function progressMetric(key: string): ProgressMetric {
  if (key === 'bodyweight' || key === 'duration') return key;
  return key.startsWith('added:') ? 'added' : 'weight';
}
