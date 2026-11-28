import { formatDuration, isCompleteSet, trackingOf } from './setTracking.ts';
import type { Exercise, WorkoutLog } from './types';

export const REP_RANGES = [[3, 5], [6, 8], [8, 12], [12, 15], [15, 20]] as const;
export const DEFAULT_REP_RANGE = REP_RANGES[2];
type RepRange = typeof REP_RANGES[number];

export function hasWorkingSets(exercise: Exercise) {
  const mode = trackingOf(exercise);
  return exercise.sets.some(set => (!set.setType || set.setType === 'working') && isCompleteSet(set, mode));
}

export function progressionFor(exercise: Exercise, range: RepRange = DEFAULT_REP_RANGE) {
  const mode = trackingOf(exercise);
  const sets = exercise.sets.filter(set => set.setType !== 'warmup' && isCompleteSet(set, mode));
  const work = sets.filter(set => !set.setType || set.setType === 'working');
  if (!work.length) return;
  if (sets.some(set => set.setType === 'failure' || (set.rpe ?? 0) >= 9)) {
    return { title: 'Repeat your last targets', reason: 'Your last session included a set at RPE 9 or higher or a set to failure.' };
  }

  if (mode === 'duration') {
    const shortest = Math.min(...work.map(set => Number(set.seconds)));
    const amount = shortest < 30 ? 1 : 5;
    return {
      title: `Try ${formatDuration(shortest + amount)} on one set`,
      reason: `Your shortest timed set was ${formatDuration(shortest)}. Extend one set if you can maintain the same technique.`,
    };
  }

  const [low, high] = range;
  const load = Number(work[0].weight);
  const fewest = Math.min(...work.map(set => Number(set.reps)));
  if (work.some(set => Number(set.weight) !== load)) {
    return { title: 'Repeat your working loads', reason: 'Your working sets used different loads. Compare sets at the same load before increasing it.' };
  }
  if (fewest < low) {
    return {
      title: 'Repeat your last targets',
      reason: `Your lowest working set was ${fewest} reps. Build toward ${low} reps per set before adding load.`,
    };
  }
  if (fewest >= high && work.length >= 2 && load > 0) {
    return {
      title: 'Try the smallest available weight increase',
      reason: `All ${work.length} working sets reached ${high} reps. After the increase, start near ${low} reps per set.`,
      readyForLoad: true,
    };
  }
  if (fewest >= high) {
    return {
      title: work.length === 1 ? 'Match your reps on another set' : 'Keep your rep target',
      reason: work.length === 1
        ? `You reached ${high} reps on one working set. Match it on another set before progressing.`
        : `You reached ${high} bodyweight reps on every working set. You can keep this target or choose a higher rep range.`,
    };
  }
  return {
    title: `Try ${fewest + 1} reps on your lowest-rep set`,
    reason: `Your lowest working set was ${fewest} reps. Keep the same load as you work toward ${high} reps per set.`,
  };
}

export function latestWorkingExercise(logs: WorkoutLog[], name: string, mode?: Exercise['tracking']) {
  for (const log of logs) {
    const exercise = log.exercises.find(exercise => exercise.name === name
      && (!mode || trackingOf(exercise) === mode)
      && hasWorkingSets(exercise));
    if (exercise) return exercise;
  }
}
