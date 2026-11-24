import React from 'react';
import type { Badge, WorkoutLog } from './types';
import { completedSetCount, longestTrainingStreak } from './training';
import { isCompleteSet, trackingOf } from './setTracking';

function icon(...paths: string[]): Badge['icon'] {
  return props => React.createElement('svg', {
    ...props, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  }, ...paths.map(path => React.createElement('path', { key: path, d: path })));
}

const Rocket = icon('M7 14c-2 0-4 2-4 4h4m3-2-2 5c3 0 5-2 5-5M7 14l3 3c6-2 10-6 11-14-8 1-12 5-14 11Z', 'M16 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z', 'm6 19-2 2');
const Dumbbell = icon('M8 12h8M6 7v10c0 1.5 2 1.5 2 0V7c0-1.5-2-1.5-2 0Zm10 0v10c0 1.5 2 1.5 2 0V7c0-1.5-2-1.5-2 0Z', 'M6 9H3v6h3m12-6h3v6h-3');
const Layers = icon('m12 3 9 5-9 5-9-5 9-5Z', 'm3 12 9 5 9-5m-18 4 9 5 9-5');
const Calendar = icon('M6 3v4m12-4v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z', 'm8 15 2 2 5-5');
const Trophy = icon('M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 3v4m-4 3h8m-7-3h6');
const Medal = icon('m7 3 4 7m6-7-4 7M12 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z', 'm10.5 15 1 1 2-2');
const Sun = icon('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2');
const Grid = icon('M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm13 0v6m-3-3h6');
const Compass = icon('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'm15.5 8.5-2 5-5 2 2-5 5-2Z');
const Target = icon('M12 3a9 9 0 1 0 9 9m-9-5a5 5 0 1 0 5 5m-5 0 7-7m-1-3v4h4');
const Mountain = icon('m2.5 19 7-12 4 7 2.5-4 5.5 9h-19Z', 'm7 11 2 1.5 2-1.5m4-6h6m-3-3v6');

function milestone(
  id: string, name: string, description: string, glyph: Badge['icon'], tone: Badge['tone'],
  target: number, count: (logs: WorkoutLog[]) => number,
): Badge {
  return {
    id, name, description, icon: glyph, tone,
    isEarned: logs => count(logs) >= target,
    progress: logs => ({ current: Math.min(count(logs), target), target }),
  };
}

export const BADGES: Badge[] = [
  milestone('first_workout', 'Getting Started', 'Log your first workout.', Rocket, 'mint', 1, logs => logs.length),
  milestone('novice_lifter', 'Finding Your Rhythm', 'Log 5 workouts.', Dumbbell, 'blue', 5, logs => logs.length),
  milestone('fifty_sets', 'Set Collector', 'Complete 50 sets across your workouts.', Layers, 'violet', 50,
    logs => logs.reduce((sum, log) => sum + completedSetCount(log), 0)),
  milestone('three_weeks', 'Showing Up', 'Log a workout in 3 consecutive weeks.', Calendar, 'mint', 3, longestTrainingStreak),
  milestone('first_pr', 'Personal Best', 'Set your first personal record.', Trophy, 'gold', 1,
    logs => logs.some(log => log.exercises.some(exercise => exercise.sets.some(set => set.isPR))) ? 1 : 0),
  milestone('dedicated_lifter', 'Dedicated Lifter', 'Log 25 workouts.', Medal, 'gold', 25, logs => logs.length),
  {
    id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Log a workout on a Saturday or Sunday.',
    icon: Sun, tone: 'coral',
    isEarned: logs => logs.some(log => [0, 6].includes(new Date(log.date).getDay())),
  },
  milestone('well_rounded', 'Well Rounded', 'Log workouts for 3 different routines.', Grid, 'violet', 3,
    logs => new Set(logs.map(log => log.routineName)).size),
  milestone('explorer', 'Explorer', 'Log 10 different exercises.', Compass, 'blue', 10,
    logs => new Set(logs.flatMap(log => log.exercises.map(exercise => exercise.name))).size),
  milestone('specialist', 'Specialist', 'Log the same exercise in 10 different sessions.', Target, 'coral', 10, logs => {
    const counts = new Map<string, number>();
    for (const log of logs) for (const name of new Set(log.exercises.map(exercise => exercise.name))) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Math.max(0, ...counts.values());
  }),
  {
    id: 'heavy_lifter', name: 'Heavy Lifter', description: 'Log a weighted set of at least 100 kg.',
    icon: Mountain, tone: 'gold',
    isEarned: logs => logs.some(log => log.exercises.some(exercise =>
      trackingOf(exercise) !== 'duration' && exercise.sets.some(set => isCompleteSet(set, trackingOf(exercise)) && Number(set.weight) >= 100))),
  },
];
