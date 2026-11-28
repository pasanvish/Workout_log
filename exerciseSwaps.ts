import { MASTER_EXERCISE_LIST } from './constants.ts';
import { getExerciseDetails } from './exerciseDetails.ts';
import { muscleGroupFor } from './muscleGroups.ts';
import { defaultTracking, trackingOf } from './setTracking.ts';
import type { CustomExercise, Exercise } from './types';

const builtIns = Object.values(MASTER_EXERCISE_LIST).flat().map(name => ({ name, ...getExerciseDetails(name) }));

export function exerciseSwaps(exercise: Exercise, inSession: Exercise[], customs: CustomExercise[]) {
  const target = getExerciseDetails(exercise.name);
  const primary = new Set(target.reference?.primaryMuscles ?? []);
  const groups = new Set([...primary].map(muscleGroupFor));
  const category = target.reference ? target.category : customs.find(item => item.name === exercise.name)?.category;
  const used = new Set([...inSession.map(item => item.name), exercise.name]);
  const timed = trackingOf(exercise) === 'duration';

  return builtIns.flatMap(candidate => {
    if (used.has(candidate.name) || (defaultTracking(candidate.name, customs) === 'duration') !== timed) return [];
    if ((candidate.category === 'Mobility') !== (category === 'Mobility')) return [];
    const matches = candidate.reference?.primaryMuscles.filter(muscle => groups.has(muscleGroupFor(muscle))) ?? [];
    if (!matches.length && (groups.size || candidate.category !== category)) return [];
    const matchScore = matches.reduce((score, muscle) => score + (primary.has(muscle) ? 5 : 2), 0);
    const score = matchScore * 10 + (candidate.category === category ? 4 : 0)
      + (candidate.equipment === target.equipment ? 2 : 0);
    return [{ name: candidate.name, equipment: candidate.equipment, matches, score }];
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
