import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { MASTER_EXERCISE_LIST } from './constants.ts';
import motion from './exerciseMotion.json' with { type: 'json' };
import { exerciseMotionFile, exerciseVisualFile, getExerciseMotion, getExerciseVisual } from './exerciseVisuals.ts';

test('every built-in exercise has an offline thumbnail and guide artwork', () => {
  const assets = new URL('./public/exercise-visuals/', import.meta.url);
  for (const name of Object.values(MASTER_EXERCISE_LIST).flat()) {
    const visual = getExerciseVisual(name);
    assert.ok(visual?.frames.length, `Missing exercise artwork for ${name}`);
    for (const frame of ['thumb' as const, ...visual.frames]) {
      const file = exerciseVisualFile(visual.id, frame);
      const bytes = readFileSync(new URL(file, assets));
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', file);
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', file);
    }
  }
});

test('every built-in exercise has a bundled Blender animation, including holds', () => {
  const assets = new URL('./public/exercise-motion/', import.meta.url);
  const expected = new Set<string>();
  for (const name of Object.values(MASTER_EXERCISE_LIST).flat()) {
    const visual = getExerciseVisual(name);
    assert.ok(visual, `Missing exercise artwork for ${name}`);
    const source = getExerciseMotion(visual.id);
    assert.equal(source, 'blender', `Missing Blender animation for ${name}`);
    expected.add(exerciseMotionFile(visual.id, source));
  }
  assert.equal(expected.size, Object.keys(motion).length);
  assert.deepEqual(new Set(readdirSync(assets)), expected);
  for (const file of expected) {
    const bytes = readFileSync(new URL(file, assets));
    assert.equal(bytes.toString('ascii', 4, 8), 'ftyp', file);
  }
});
