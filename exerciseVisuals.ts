import illustrations from './exerciseVisuals.json' with { type: 'json' };

export type ExerciseFrame = 'start' | 'mid' | 'end' | 'hold' | 'pose';

interface ExerciseVisual {
  id: string;
  frames: readonly ExerciseFrame[];
  width: number;
  height: number;
  original?: boolean;
}

export const ILLUSTRATION_SOURCE = 'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732';
const visuals = illustrations as Record<string, ExerciseVisual>;

export function getExerciseVisual(name: string) {
  return Object.hasOwn(visuals, name) ? visuals[name] : undefined;
}

export function exerciseVisualUrl(id: string, frame: ExerciseFrame | 'thumb') {
  return `${import.meta.env.BASE_URL}exercise-visuals/${id}-${frame}.webp`;
}
