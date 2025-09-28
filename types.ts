import React from 'react';

export interface Profile {
  id: string;
  name: string;
}

export interface CustomRoutine {
  id: string;
  name: string;
  exercises: string[];
}

export interface CustomExercise {
  id: string;
  name: string;
  category: string;
}

export interface Set {
    id: string;
    weight: string;
    reps: string;
    isPR?: boolean;
}

export interface Exercise {
    name:string;
    sets: Set[];
}

export interface WorkoutLog {
    id: string;
    date: string;
    routineName: string;
    exercises: Exercise[];
    effort?: number; // 1 (easy) to 5 (max effort)
    totalWeightLifted?: number;
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
  isEarned: (logs: WorkoutLog[]) => boolean;
}

// Personal Record Types
export interface PR {
  weight: number;
  date: string;
}

export type ExercisePRs = Record<string, PR>; // Key: reps as string
export type ProfilePRs = Record<string, ExercisePRs>; // Key: exerciseName
export type AllPRs = Record<string, ProfilePRs>; // Key: profileId