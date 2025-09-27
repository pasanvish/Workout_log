
export interface Profile {
  id: string;
  name: string;
}

export interface CustomRoutine {
  id: string;
  name: string;
  exercises: string[];
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
}
