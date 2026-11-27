import React from 'react';

export type Accent = 'mint' | 'blue' | 'violet' | 'amber';

export interface ProfileAppearance {
  avatar?: string;
  accent?: Accent;
  weeklyGoal?: number;
  restSeconds?: number;
}

export interface Profile extends ProfileAppearance {
  id: string;
  name: string;
}

export interface CustomRoutine {
  id: string;
  name: string;
  exercises: string[];
}

export type TrackingMode = 'weight' | 'bodyweight' | 'duration';

export interface CustomExercise {
  id: string;
  name: string;
  category: string;
  tracking?: TrackingMode;
}

export type SetType = 'working' | 'warmup' | 'drop' | 'failure';

export interface Set {
    id: string;
    weight: string;
    reps: string;
    seconds?: string;
    isPR?: boolean;
    setType?: SetType;
    rpe?: number;
}

export interface Exercise {
    name: string;
    tracking?: TrackingMode;
    sets: Set[];
    notes?: string;
}

export interface WorkoutLog {
    id: string;
    date: string;
    routineName: string;
    exercises: Exercise[];
    effort?: number; // 1 (easy) to 5 (max effort)
}

export interface BodyMeasurementLog {
  id: string;
  date: string;
  weight?: string;
  bodyFat?: string;
  neck?: string;
  shoulders?: string;
  chest?: string;
  biceps?: string;
  waist?: string;
  hips?: string;
  thighs?: string;
  calves?: string;
}


export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  tone: 'mint' | 'blue' | 'violet' | 'gold' | 'coral';
  isEarned: (logs: WorkoutLog[]) => boolean;
  progress?: (logs: WorkoutLog[]) => { current: number; target: number };
}

// Personal Record Types
export interface PR {
  value: number;
  date: string;
}

export type ExercisePRs = Record<string, PR>; // Key: tracking metric and, where applicable, rep count
export type ProfilePRs = Record<string, ExercisePRs>; // Key: exerciseName
