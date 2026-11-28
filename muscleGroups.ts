export const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#80eacf',
  Back: '#6ebdf0',
  Shoulders: '#a99cff',
  Biceps: '#edbd79',
  Triceps: '#ef947d',
  Forearms: '#d6a3ed',
  Core: '#f1d674',
  Quads: '#81d999',
  Hamstrings: '#59c8be',
  Glutes: '#ec90bf',
  Calves: '#9ebce9',
  Adductors: '#d7a98e',
  Legs: '#a5d589',
  Neck: '#b9a8df',
};

const groups: Record<string, string> = {
  Chest: 'Chest', 'Upper chest': 'Chest', 'Serratus anterior': 'Chest',
  Lats: 'Back', 'Mid back': 'Back', Rhomboids: 'Back', Traps: 'Back', 'Spinal erectors': 'Back',
  'Front delts': 'Shoulders', 'Side delts': 'Shoulders', 'Rear delts': 'Shoulders',
  Biceps: 'Biceps', Brachialis: 'Biceps', Triceps: 'Triceps',
  Brachioradialis: 'Forearms', 'Forearm flexors': 'Forearms',
  Abs: 'Core', 'Deep abs': 'Core', Obliques: 'Core', 'Hip flexors': 'Core',
  Quads: 'Quads', Hamstrings: 'Hamstrings', 'Glute max': 'Glutes', 'Glute medius': 'Glutes', 'Hip abductors': 'Glutes',
  Gastrocnemius: 'Calves', Soleus: 'Calves', 'Hip adductors': 'Adductors',
};

export const muscleGroupFor = (muscle: string) => Object.hasOwn(groups, muscle) ? groups[muscle] : muscle;
export const muscleColor = (group: string) => Object.hasOwn(MUSCLE_COLORS, group) ? MUSCLE_COLORS[group] : '#8a9da9';
