import assert from 'node:assert/strict';
import { test } from 'node:test';
import { weeklySummaryFacts, workoutRecap } from './localAi.ts';

const weekly = {
  ...weeklySummaryFacts([], 3),
  thisWeek: { workouts: 2, sets: 18 },
  lastWeek: { workouts: 1, sets: 1 },
};

test('accepts exact counts and strips any claims beyond the two verified sentences', () => {
  const summary = 'This week: 2 workouts and 18 logged sets. Last week: 1 workout and 1 logged set.';
  assert.deepEqual(workoutRecap('qwen', `${summary} Your last goal was 24 workouts.`, weekly), {
    summary,
    generated: true,
  });
});

test('uses log data when a model changes a workout or set count', () => {
  assert.deepEqual(workoutRecap('qwen', 'This week: 20 workouts and 18 sets. Last week: 1 workout and 1 set.', weekly), {
    summary: 'This week: 2 workouts and 18 sets. Last week: 1 workout and 1 set.',
    generated: false,
  });
});

test('accepts a short Lite recap with matching counts', () => {
  assert.deepEqual(workoutRecap('lite', 'I logged 2 workouts and 18 sets this week.', weekly), {
    summary: 'You logged 2 workouts and 18 sets this week.',
    generated: true,
  });
});
