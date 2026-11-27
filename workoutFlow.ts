import type { Exercise } from './types';

export function supersetLabels(exercises: Exercise[]) {
  const groups = new Map<string, number>();
  for (const { superset } of exercises) {
    if (superset) groups.set(superset, (groups.get(superset) ?? 0) + 1);
  }
  return new Map([...groups].filter(([, count]) => count >= 2).map(([group], index) => [group, `Superset ${index + 1}`]));
}

export function clearUnpairedSupersets(exercises: Exercise[]) {
  const groups = supersetLabels(exercises);
  return exercises.map(exercise => exercise.superset && !groups.has(exercise.superset) ? { ...exercise, superset: undefined } : exercise);
}

export function setCompletionAction(exercises: Exercise[], exerciseIndex: number, setIndex: number) {
  const current = exercises[exerciseIndex];
  if (!current.superset) return { restSeconds: current.restSeconds };
  const indexes = exercises.flatMap((exercise, index) => exercise.superset === current.superset ? [index] : []);
  const position = indexes.indexOf(exerciseIndex);
  const remaining = [...indexes.slice(position + 1), ...indexes.slice(0, position)];
  const next = remaining.find(index => exercises[index].sets[setIndex] && !exercises[index].sets[setIndex].checked);
  if (next !== undefined) return { next };
  const last = [...indexes].reverse().find(index => exercises[index].sets[setIndex]);
  return { restSeconds: last === undefined ? undefined : exercises[last].restSeconds };
}
