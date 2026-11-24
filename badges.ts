import React from 'react';
import type { Badge, WorkoutLog } from './types';
import { completedSetCount, longestTrainingStreak } from './training';

// Icon Components
const FirstWorkoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  // Fix: Converted from JSX to React.createElement to be valid in a .ts file.
  React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" })
  )
);

const DumbbellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    // Fix: Converted from JSX to React.createElement to be valid in a .ts file.
    React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" }),
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" }),
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.5 10.5h.008v.008H4.5V10.5z" })
    )
);

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  // Fix: Converted from JSX to React.createElement to be valid in a .ts file.
  React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" })
  )
);

const MapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    // Fix: Converted from JSX to React.createElement to be valid in a .ts file.
    React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.25c-2.65 0-5.093.9-7.07 2.55a14.98 14.98 0 00-3.07 17.58 14.98 14.98 0 0017.58 3.07z" })
    )
);

const MedalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  // Fix: Converted from JSX to React.createElement to be valid in a .ts file.
  React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" })
  )
);

const FireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    // Fix: Converted from JSX to React.createElement to be valid in a .ts file.
    React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.797A8.33 8.33 0 0112 2.25c1.153 0 2.243.3 3.218.834a8.224 8.224 0 01.144 2.13z" })
    )
);


function milestone(
  id: string, name: string, description: string, icon: Badge['icon'],
  target: number, count: (logs: WorkoutLog[]) => number,
): Badge {
  return {
    id, name, description, icon,
    isEarned: logs => count(logs) >= target,
    progress: logs => ({ current: Math.min(count(logs), target), target }),
  };
}

export const BADGES: Badge[] = [
  milestone('first_workout', 'Getting Started', 'Log your first workout.', FirstWorkoutIcon, 1, logs => logs.length),
  milestone('novice_lifter', 'Finding Your Rhythm', 'Log 5 workouts.', DumbbellIcon, 5, logs => logs.length),
  milestone('fifty_sets', 'Set Collector', 'Complete 50 sets across your workouts.', DumbbellIcon, 50,
    logs => logs.reduce((sum, log) => sum + completedSetCount(log), 0)),
  milestone('three_weeks', 'Showing Up', 'Log a workout in 3 consecutive weeks.', CalendarIcon, 3, longestTrainingStreak),
  milestone('first_pr', 'Personal Best', 'Set your first personal record.', MedalIcon, 1,
    logs => logs.some(log => log.exercises.some(exercise => exercise.sets.some(set => set.isPR))) ? 1 : 0),
  milestone('dedicated_lifter', 'Dedicated Lifter', 'Log 25 workouts.', MedalIcon, 25, logs => logs.length),
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Log a workout on a Saturday or Sunday.',
    icon: CalendarIcon,
    isEarned: (logs) => logs.some(log => {
      const day = new Date(log.date).getDay();
      return day === 0 || day === 6;
    }),
  },
  {
    id: 'well_rounded',
    name: 'Well Rounded',
    description: 'Log workouts for 3 different routines.',
    icon: FireIcon,
    isEarned: (logs) => new Set(logs.map(log => log.routineName)).size >= 3,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Log 10 different exercises.',
    icon: MapIcon,
    isEarned: (logs) => {
      const uniqueExercises = new Set(logs.flatMap(log => log.exercises.map(ex => ex.name)));
      return uniqueExercises.size >= 10;
    },
  },
  {
    id: 'specialist',
    name: 'Specialist',
    description: 'Log the same exercise in 10 different sessions.',
    icon: (props) => (
        // Fix: Converted from JSX to React.createElement to be valid in a .ts file.
        React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 },
            React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" })
        )
    ),
    isEarned: (logs) => {
        const exerciseCounts: Record<string, number> = Object.create(null);
        logs.forEach(log => {
            const exercisesInLog = new Set(log.exercises.map(ex => ex.name));
            exercisesInLog.forEach(exName => {
                exerciseCounts[exName] = (exerciseCounts[exName] || 0) + 1;
            });
        });
        return Object.values(exerciseCounts).some(count => count >= 10);
    }
  },
  {
    id: 'heavy_lifter',
    name: 'Heavy Lifter',
    description: 'Log a set of at least 100 kg.',
    icon: (props) => (
        // Fix: Converted from JSX to React.createElement to be valid in a .ts file.
        React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 },
            React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" })
        )
    ),
    isEarned: (logs) => {
        return logs.some(log => 
            log.exercises.some(ex => 
                ex.sets.some(set => parseFloat(set.weight) >= 100)
            )
        );
    }
  }
];