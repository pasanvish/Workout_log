
export enum WorkoutDay {
    BicepsTricepsShoulders = "Biceps, Triceps & Shoulders",
    ChestBack = "Chest & Back",
    Legs = "Legs"
}

export interface Set {
    id: string;
    weight: string;
    reps: string;
}

export interface Exercise {
    name: string;
    sets: Set[];
}

export interface WorkoutLog {
    id: string;
    date: string;
    day: WorkoutDay;
    exercises: Exercise[];
}
