import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { MASTER_EXERCISE_LIST } from './constants.ts';
import { getExerciseVisual, hasExerciseMotion } from './exerciseVisuals.ts';

test('every built-in exercise has an offline thumbnail and guide artwork', () => {
  const assets = new URL('./public/exercise-visuals/', import.meta.url);
  for (const name of Object.values(MASTER_EXERCISE_LIST).flat()) {
    const visual = getExerciseVisual(name);
    assert.ok(visual?.frames.length, `Missing exercise artwork for ${name}`);
    for (const frame of ['thumb', ...visual.frames]) {
      const file = `${visual.id}-${frame}.webp`;
      const bytes = readFileSync(new URL(file, assets));
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', file);
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', file);
    }
  }
});

test('illustrated motion points to bundled MP4s for multi-pose guides', () => {
  const assets = new URL('./public/exercise-motion/', import.meta.url);
  const expected = new Set<string>();
  for (const name of Object.values(MASTER_EXERCISE_LIST).flat()) {
    const visual = getExerciseVisual(name);
    if (!visual || !hasExerciseMotion(visual.id)) continue;
    assert.ok(visual.frames.length > 1, name);
    expected.add(`${visual.id}.mp4`);
  }
  assert.ok(expected.size > 0);
  assert.deepEqual(new Set(readdirSync(assets)), expected);
  for (const file of expected) {
    const bytes = readFileSync(new URL(file, assets));
    assert.equal(bytes.toString('ascii', 4, 8), 'ftyp', file);
  }
});
