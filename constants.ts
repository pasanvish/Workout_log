
import { WorkoutDay } from './types';

export const WORKOUT_ROUTINES: Record<WorkoutDay, string[]> = {
    [WorkoutDay.BicepsTricepsShoulders]: [
        "Preacher Curls",
        "Ez Bar Curls",
        "Incline Bench Dumbbell Raise",
        "Cable Bicep Curls",
        "Cable Triceps Extensions",
        "Cable Lateral Raise",
        "Machine Lateral Raise",
        "Machine Shoulder Press",
        "Dumbbell Lateral Raise"
    ],
    [WorkoutDay.ChestBack]: [
        "Chest Fly",
        "Cable Rows",
        "Incline Bench Press (Smith Machine)",
        "Incline Dumbbell Press",
        "Chest Press Machine",
        "Decline Press Machine",
        "Lat Pulldowns",
        "T-Bar Rows",
        "Ab Crunches Machine"
    ],
    [WorkoutDay.Legs]: [
        "Leg Extension",
        "Barbell Squats",
        "Abductor Machine",
        "Adductor Machine",
        "Calf Raises",
        "Leg Press",
        "Leg Curls",
        "Lunges",
        "Hip Thrust"
    ]
};
