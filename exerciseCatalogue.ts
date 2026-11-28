import data from './exerciseCatalogue.json' with { type: 'json' };
import type { TrackingMode } from './types';

interface CatalogueExercise {
  name: string;
  category: string;
  equipment: string;
  tracking: TrackingMode;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  steps: string[];
}

export const EXTRA_EXERCISES = data as CatalogueExercise[];
export const CATALOGUE_SOURCE = 'https://github.com/yuhonas/free-exercise-db/tree/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const exercisesByName = new Map(EXTRA_EXERCISES.map(exercise => [exercise.name, exercise]));

export function getCatalogueExercise(name: string) {
  return exercisesByName.get(name);
}

const originalByEquipment = {
  Barbell: [
    'Bench Press (Barbell)', 'Incline Bench Press (Barbell)', 'Decline Bench Press (Barbell)', 'Deadlift',
    'Bent Over Row (Barbell)', 'Good Mornings', 'Barbell Squats', 'Hip Thrust', 'Overhead Press (Barbell)',
    'Upright Row', 'Barbell Curl', 'Close Grip Bench Press',
  ],
  Dumbbells: [
    'Dumbbell Press', 'Incline Dumbbell Press', 'Decline Dumbbell Press', 'Chest Fly (Dumbbell)',
    'Incline Chest Fly (Dumbbell)', 'Dumbbell Row (One Arm)', 'Lunges (Dumbbell)', 'Goblet Squat',
    'Seated Dumbbell Press', 'Dumbbell Lateral Raise', 'Front Raise (Dumbbell)', 'Arnold Press',
    'Dumbbell Curl', 'Hammer Curl', 'Incline Bench Dumbbell Curl', 'Concentration Curl',
    'Overhead Triceps Extension (Dumbbell)', 'Tricep Kickbacks',
  ],
  Cable: [
    'Cable Crossover', 'Lat Pulldowns', 'Seated Cable Rows', 'Face Pulls', 'Cable Bicep Curls',
    'Cable Triceps Pushdown', 'Cable Crunches',
  ],
  Machine: [
    'Chest Press Machine', 'Pec Deck Machine (Chest Fly)', 'T-Bar Rows', 'Leg Press', 'Leg Extension Machine',
    'Leg Curls Machine', 'Abductor Machine', 'Adductor Machine', 'Machine Lateral Raise', 'Reverse Pec Deck',
    'Ab Crunches Machine',
  ],
  Bodyweight: [
    'Push-ups', 'Pull-ups', 'Chin-ups', 'Back Extension (Hyperextension)', 'Calf Raises',
    'Triceps Dips', 'Crunches', 'Leg Raises', 'Plank', 'Russian Twist',
  ],
  'EZ bar': ['Ez Bar Curls', 'Preacher Curls', 'Skull Crushers (Ez Bar)'],
};

const originalEquipment = new Map(Object.entries(originalByEquipment)
  .flatMap(([equipment, names]) => names.map(name => [name, equipment] as const)));

export function exerciseEquipment(name: string) {
  return getCatalogueExercise(name)?.equipment ?? originalEquipment.get(name);
}
