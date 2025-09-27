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
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isEarned: (logs: WorkoutLog[]) => boolean;
}