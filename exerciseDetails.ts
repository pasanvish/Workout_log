import { MASTER_EXERCISE_LIST } from './constants';

type ArtworkSource = 'repdb' | 'workoutGuide';

interface ExerciseReference {
  id: string;
  source: ArtworkSource;
  frames: readonly string[];
  primaryMuscles: readonly string[];
  secondaryMuscles: readonly string[];
  description: string;
}

const references: Record<string, ExerciseReference> = {
  "Bench Press (Barbell)": {
    id: "bench-press", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Chest"], secondaryMuscles: ["Front delts", "Triceps"],
    description: "A classic chest builder. Lower the bar toward your chest, then press with control.",
  },
  "Incline Bench Press (Barbell)": {
    id: "incline-bench-press", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Upper chest"], secondaryMuscles: ["Front delts", "Triceps"],
    description: "An angled barbell press that emphasizes the upper chest. Keep your shoulders supported.",
  },
  "Decline Bench Press (Barbell)": {
    id: "decline-bench-press-barbell", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Chest"], secondaryMuscles: ["Front delts", "Triceps"],
    description: "A decline bench press for the chest. Keep your feet secured and lower the bar smoothly.",
  },
  "Dumbbell Press": {
    id: "db-bench-press", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Chest"], secondaryMuscles: ["Front delts", "Triceps"],
    description: "Press two dumbbells above your chest, keeping each arm steady through the movement.",
  },
  "Incline Dumbbell Press": {
    id: "incline-db-press", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Upper chest"], secondaryMuscles: ["Front delts", "Triceps"],
    description: "Press from an inclined bench to train the upper chest with an independent weight in each hand.",
  },
  "Decline Dumbbell Press": {
    id: "decline-bench-press", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Chest"], secondaryMuscles: ["Front delts", "Triceps"],
    description: "Press dumbbells from a decline bench, keeping your shoulders stable and feet secured.",
  },
  "Chest Fly (Dumbbell)": {
    id: "db-fly", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Chest"], secondaryMuscles: ["Front delts"],
    description: "Open your arms in a wide arc, then bring the dumbbells together with a soft bend in your elbows.",
  },
  "Incline Chest Fly (Dumbbell)": {
    id: "incline-dumbbell-fly", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Upper chest"], secondaryMuscles: ["Front delts", "Biceps"],
    description: "An incline fly for the upper chest. Use a comfortable range and keep your elbows softly bent.",
  },
  "Chest Press Machine": {
    id: "chest-press-machine", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Chest"], secondaryMuscles: ["Front delts", "Triceps"],
    description: "A supported chest press. Adjust the seat so the handles start near chest height.",
  },
  "Pec Deck Machine (Chest Fly)": {
    id: "pec-deck", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Chest"], secondaryMuscles: ["Front delts", "Serratus anterior"],
    description: "Bring the machine pads together in front of your chest without rounding your shoulders.",
  },
  "Cable Crossover": {
    id: "cable-fly", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Chest"], secondaryMuscles: ["Front delts"],
    description: "Draw the cable handles together in front of your chest while keeping your torso stable.",
  },
  "Push-ups": {
    id: "push-up", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Chest", "Triceps"], secondaryMuscles: ["Front delts"],
    description: "A bodyweight chest and triceps movement. Lower and push up while keeping your body in a straight line.",
  },
  "Deadlift": {
    id: "deadlift", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Spinal erectors", "Glute max", "Hamstrings"], secondaryMuscles: ["Quads", "Traps"],
    description: "Lift from the floor by extending your hips and knees. Brace your trunk and keep the bar close.",
  },
  "Pull-ups": {
    id: "pull-up", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Lats"], secondaryMuscles: ["Biceps", "Rear delts", "Rhomboids"],
    description: "Pull your body toward the bar with an overhand grip, then lower without swinging.",
  },
  "Chin-ups": {
    id: "chin-ups", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Biceps", "Lats"], secondaryMuscles: ["Rhomboids"],
    description: "Use an underhand grip to pull your chin toward the bar, training your back and biceps.",
  },
  "Lat Pulldowns": {
    id: "lat-pulldown", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Lats"], secondaryMuscles: ["Biceps", "Rear delts", "Rhomboids"],
    description: "Pull the bar toward your upper chest, driving your elbows down and controlling the return.",
  },
  "Bent Over Row (Barbell)": {
    id: "barbell-row", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Lats", "Rhomboids"], secondaryMuscles: ["Biceps", "Rear delts"],
    description: "Hinge forward and row the bar toward your torso, keeping your back position steady.",
  },
  "T-Bar Rows": {
    id: "t-bar-row", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Lats", "Rhomboids"], secondaryMuscles: ["Biceps", "Spinal erectors", "Traps"],
    description: "Row the handles toward your torso with a braced trunk and a controlled lowering phase.",
  },
  "Seated Cable Rows": {
    id: "seated-cable-row", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Lats", "Rhomboids"], secondaryMuscles: ["Biceps", "Spinal erectors", "Rear delts"],
    description: "Pull the cable toward your torso and gently squeeze your shoulder blades together.",
  },
  "Dumbbell Row (One Arm)": {
    id: "single-arm-db-row", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Lats", "Rhomboids"], secondaryMuscles: ["Biceps", "Rear delts"],
    description: "Support your torso and row one dumbbell toward your hip without twisting your body.",
  },
  "Good Mornings": {
    id: "good-morning", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Spinal erectors", "Glute max", "Hamstrings"], secondaryMuscles: [],
    description: "With a light bar on your upper back, hinge at the hips and return to standing with control.",
  },
  "Back Extension (Hyperextension)": {
    id: "back-extension", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Spinal erectors"], secondaryMuscles: ["Glute max", "Hamstrings"],
    description: "Extend through your hips on a back-extension bench, finishing with your body in line.",
  },
  "Face Pulls": {
    id: "face-pull", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Rear delts", "Rhomboids"], secondaryMuscles: ["Traps"],
    description: "Pull a rope attachment toward your face with elbows wide to train the rear shoulders and upper back.",
  },
  "Barbell Squats": {
    id: "squat", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Glute max", "Quads"], secondaryMuscles: ["Spinal erectors", "Hamstrings"],
    description: "Sit down between your hips with a braced trunk, then push through your feet to stand.",
  },
  "Leg Press": {
    id: "leg-press", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Glute max", "Quads"], secondaryMuscles: ["Hamstrings"],
    description: "Push the platform away while keeping your hips against the seat and knees aligned with your toes.",
  },
  "Lunges (Dumbbell)": {
    id: "db-lunge", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Glute max", "Quads"], secondaryMuscles: ["Hamstrings"],
    description: "Step into a split stance and lower both knees, then drive through your front foot to return.",
  },
  "Leg Extension Machine": {
    id: "leg-extension", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Quads"], secondaryMuscles: [],
    description: "Straighten your knees against the pad to train the front of your thighs. Lower slowly.",
  },
  "Leg Curls Machine": {
    id: "leg-curl", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Hamstrings"], secondaryMuscles: ["Gastrocnemius"],
    description: "Bend your knees against the pad to train the hamstrings, keeping your hips stable.",
  },
  "Calf Raises": {
    id: "bodyweight-calf-raise", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Gastrocnemius", "Soleus"], secondaryMuscles: [],
    description: "Rise onto the balls of your feet, pause briefly, then lower your heels with control.",
  },
  "Hip Thrust": {
    id: "hip-thrust", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Glute max", "Glute medius"], secondaryMuscles: ["Hamstrings"],
    description: "With your upper back supported, lift your hips and squeeze your glutes without arching your back.",
  },
  "Abductor Machine": {
    id: "hip-abduction", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Glute medius"], secondaryMuscles: ["Hip abductors"],
    description: "Press your thighs outward against the pads with a steady torso to train the outer hips.",
  },
  "Adductor Machine": {
    id: "hip-adduction", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Hip adductors"], secondaryMuscles: [],
    description: "Bring your thighs together against resistance with a steady torso to train the inner thighs.",
  },
  "Goblet Squat": {
    id: "db-goblet-squat", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Glute max", "Quads"], secondaryMuscles: ["Hip adductors", "Hamstrings", "Abs"],
    description: "Hold a weight at your chest, squat between your hips, then stand with your chest lifted.",
  },
  "Overhead Press (Barbell)": {
    id: "overhead-press", source: "workoutGuide", frames: ["1", "2"],
    primaryMuscles: ["Front delts", "Side delts"], secondaryMuscles: ["Triceps", "Traps", "Abs"],
    description: "Press the bar from your upper chest overhead while keeping your trunk braced.",
  },
  "Seated Dumbbell Press": {
    id: "seated-db-press", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Front delts", "Side delts"], secondaryMuscles: ["Traps", "Triceps"],
    description: "Press dumbbells overhead from a supported seated position, keeping your ribs controlled.",
  },
  "Dumbbell Lateral Raise": {
    id: "lateral-raise", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Side delts"], secondaryMuscles: ["Front delts"],
    description: "Lift dumbbells out to your sides with softly bent elbows to train the side shoulders.",
  },
  "Machine Lateral Raise": {
    id: "plate-loaded-lateral-raise", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Side delts"], secondaryMuscles: ["Front delts", "Traps"],
    description: "Raise your upper arms against the machine pads without shrugging your shoulders.",
  },
  "Front Raise (Dumbbell)": {
    id: "dumbbell-front-raise", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Front delts"], secondaryMuscles: ["Side delts"],
    description: "Lift the dumbbells in front of your body toward shoulder height without swinging.",
  },
  "Reverse Pec Deck": {
    id: "machine-reverse-fly", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Rear delts"], secondaryMuscles: ["Rhomboids", "Traps"],
    description: "Open your arms against the pads to train the rear shoulders, keeping your chest supported.",
  },
  "Arnold Press": {
    id: "arnold-press", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Front delts", "Side delts"], secondaryMuscles: ["Serratus anterior", "Traps", "Triceps"],
    description: "Rotate your palms outward as you press dumbbells overhead through a comfortable range.",
  },
  "Upright Row": {
    id: "upright-row", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Side delts", "Traps"], secondaryMuscles: ["Front delts", "Biceps"],
    description: "Draw the weight upward close to your torso, using a range that feels comfortable for your shoulders.",
  },
  "Barbell Curl": {
    id: "barbell-curl", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Biceps"], secondaryMuscles: ["Brachialis", "Forearm flexors"],
    description: "Curl the bar toward your shoulders, keeping your upper arms still and your torso steady.",
  },
  "Ez Bar Curls": {
    id: "ez-bar-curl", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Biceps"], secondaryMuscles: ["Brachialis", "Brachioradialis"],
    description: "Curl an angled bar with your elbows at your sides, then lower it under control.",
  },
  "Dumbbell Curl": {
    id: "bicep-curl", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Biceps"], secondaryMuscles: ["Brachialis", "Forearm flexors"],
    description: "Bend your elbows to lift the dumbbells, keeping your upper arms close to your sides.",
  },
  "Hammer Curl": {
    id: "hammer-curl", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Biceps", "Brachialis"], secondaryMuscles: ["Forearm flexors"],
    description: "Curl with palms facing inward to train your biceps and forearms without swinging.",
  },
  "Preacher Curls": {
    id: "preacher-curl", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Biceps"], secondaryMuscles: ["Brachialis"],
    description: "Rest your upper arms on the pad and curl the weight, controlling the bottom of the movement.",
  },
  "Incline Bench Dumbbell Curl": {
    id: "incline-db-curl", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Biceps"], secondaryMuscles: ["Brachialis"],
    description: "Curl from an incline bench with your arms hanging by your sides and shoulders still.",
  },
  "Cable Bicep Curls": {
    id: "cable-curl", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Biceps"], secondaryMuscles: ["Brachialis"],
    description: "Curl a low cable toward your shoulders while keeping your elbows close to your body.",
  },
  "Concentration Curl": {
    id: "concentration-curl", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Biceps"], secondaryMuscles: ["Brachialis"],
    description: "Support your upper arm against your inner thigh and curl one dumbbell with control.",
  },
  "Triceps Dips": {
    id: "dip", source: "workoutGuide", frames: ["1", "2"],
    primaryMuscles: ["Triceps"], secondaryMuscles: ["Chest", "Front delts"],
    description: "Lower your body between the bars, then extend your elbows to press back up.",
  },
  "Close Grip Bench Press": {
    id: "close-grip-bench-press", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Triceps"], secondaryMuscles: ["Front delts", "Chest"],
    description: "Use a narrower comfortable grip on the bench press to give your triceps more work.",
  },
  "Skull Crushers (Ez Bar)": {
    id: "ez-bar-lying-tricep-extension", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Triceps"], secondaryMuscles: [],
    description: "Lying on a bench, bend your elbows to lower the bar near your forehead, then extend.",
  },
  "Cable Triceps Pushdown": {
    id: "tricep-pushdown", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Triceps"], secondaryMuscles: [],
    description: "Keep your elbows by your sides and straighten your arms to press the cable down.",
  },
  "Overhead Triceps Extension (Dumbbell)": {
    id: "overhead-tricep-extension", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Triceps"], secondaryMuscles: [],
    description: "Lower a dumbbell behind your head by bending your elbows, then extend with control.",
  },
  "Tricep Kickbacks": {
    id: "tricep-kickback", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Triceps"], secondaryMuscles: [],
    description: "Hinge forward and straighten your elbows behind you while keeping your upper arms still.",
  },
  "Crunches": {
    id: "crunches", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Abs"], secondaryMuscles: ["Obliques"],
    description: "Lift your shoulder blades off the floor by drawing your ribs toward your pelvis.",
  },
  "Leg Raises": {
    id: "lying-leg-raise", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Hip flexors", "Abs"], secondaryMuscles: ["Obliques", "Deep abs"],
    description: "Raise and lower your legs while keeping your trunk controlled and avoiding a lower-back arch.",
  },
  "Plank": {
    id: "plank", source: "repdb", frames: ["main"],
    primaryMuscles: ["Abs", "Deep abs"], secondaryMuscles: ["Spinal erectors"],
    description: "Hold a straight line from shoulders to heels, bracing your abs and breathing steadily.",
  },
  "Russian Twist": {
    id: "russian-twist", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Obliques", "Abs"], secondaryMuscles: ["Hip flexors"],
    description: "Sit with knees bent and rotate your torso from side to side through a controlled range.",
  },
  "Ab Crunches Machine": {
    id: "machine-seated-crunch", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Abs"], secondaryMuscles: ["Obliques", "Deep abs"],
    description: "Draw your ribs toward your pelvis against the machine resistance without pulling with your arms.",
  },
  "Cable Crunches": {
    id: "cable-crunch", source: "repdb", frames: ["start", "peak"],
    primaryMuscles: ["Abs"], secondaryMuscles: ["Obliques", "Deep abs"],
    description: "Kneel at a high cable and curl your trunk, bringing your ribs toward your pelvis.",
  },
};

const categories = new Map(
  Object.entries(MASTER_EXERCISE_LIST).flatMap(([category, names]) =>
    names.map(name => [name, category] as const),
  ),
);

export function getExerciseDetails(name: string) {
  const reference = Object.hasOwn(references, name) ? references[name] : undefined;
  return {
    category: categories.get(name) ?? 'Custom exercise',
    description: reference?.description ?? 'Custom exercise added to your library.',
    reference,
  };
}
