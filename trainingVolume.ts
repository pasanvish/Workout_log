import { getExerciseDetails } from './exerciseDetails.ts';
import { isCompleteSet, trackingOf } from './setTracking.ts';
import { localLogDate, weekStart } from './training.ts';
import type { CustomExercise, WorkoutLog } from './types';

const muscleGroup: Record<string, string> = {
  Chest: 'Chest', 'Upper chest': 'Chest',
  Lats: 'Back', Rhomboids: 'Back', Traps: 'Back', 'Spinal erectors': 'Back',
  'Front delts': 'Shoulders', 'Side delts': 'Shoulders', 'Rear delts': 'Shoulders',
  Biceps: 'Biceps', Brachialis: 'Biceps', Triceps: 'Triceps',
  Abs: 'Core', 'Deep abs': 'Core', Obliques: 'Core', 'Hip flexors': 'Core',
  Quads: 'Quads', Hamstrings: 'Hamstrings', 'Glute max': 'Glutes', 'Glute medius': 'Glutes',
  Gastrocnemius: 'Calves', Soleus: 'Calves', 'Hip adductors': 'Adductors',
};

export function weeklyMuscleSets(logs: WorkoutLog[], customExercises: CustomExercise[], start: number) {
  const customGroups = new Map(customExercises.map(({ name, category }) => [name, category === 'Abs' ? 'Core' : category]));
  const counts = new Map<string, number>();
  for (const log of logs) {
    if (weekStart(localLogDate(log.date)) !== start) continue;
    for (const exercise of log.exercises) {
      const mode = trackingOf(exercise);
      const sets = exercise.sets.filter(set => set.setType !== 'warmup' && isCompleteSet(set, mode)).length;
      if (!sets) continue;
      const details = getExerciseDetails(exercise.name);
      const groups = details.reference?.primaryMuscles.map(muscle => muscleGroup[muscle] ?? muscle)
        ?? [customGroups.get(exercise.name) ?? 'Uncategorized'];
      for (const group of new Set(groups)) counts.set(group, (counts.get(group) ?? 0) + sets);
    }
  }
  return [...counts].sort(([a, first], [b, second]) => second - first || a.localeCompare(b));
}
