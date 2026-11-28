import illustrations from './exerciseVisuals.json' with { type: 'json' };
import motion from './exerciseMotion.json' with { type: 'json' };

export type ExerciseFrame = 'start' | 'mid' | 'end' | 'hold' | 'pose';
export type ExerciseMotionSource = 'blender' | 'interpolated';

interface ExerciseVisual {
  id: string;
  frames: readonly ExerciseFrame[];
  width: number;
  height: number;
  original?: boolean;
}

export const ILLUSTRATION_SOURCE = 'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732';
export const BLENDER_MESH_SOURCE = 'https://www.blender.org/download/demo-files/#asset-libraries';
const visuals = illustrations as Record<string, ExerciseVisual>;
const animatedVisuals = motion as Record<string, ExerciseMotionSource>;

export function getExerciseVisual(name: string) {
  return Object.hasOwn(visuals, name) ? visuals[name] : undefined;
}

export function exerciseVisualUrl(id: string, frame: ExerciseFrame | 'thumb') {
  return `${import.meta.env.BASE_URL}exercise-visuals/${exerciseVisualFile(id, frame)}`;
}

export function exerciseVisualFile(id: string, frame: ExerciseFrame | 'thumb') {
  return `${getExerciseMotion(id) === 'blender' ? '3d-' : ''}${id}-${frame}.webp`;
}

export function getExerciseMotion(id: string) {
  return Object.hasOwn(animatedVisuals, id) ? animatedVisuals[id] : undefined;
}

export function exerciseMotionFile(id: string, source: ExerciseMotionSource) {
  return `${source === 'blender' ? '3d-' : ''}${id}.mp4`;
}

export function exerciseMotionUrl(id: string, source: ExerciseMotionSource) {
  return `${import.meta.env.BASE_URL}exercise-motion/${exerciseMotionFile(id, source)}`;
}
