interface ExerciseDemo {
  file: string;
  author: string;
  page: string;
  license: string;
  licenseUrl: string;
}

const DEMOS: Record<string, ExerciseDemo> = {
  "Bench Press (Barbell)": {
    "file": "bench-press",
    "author": "FitnessScape",
    "page": "https://commons.wikimedia.org/wiki/File:Bench_press_-_exercise_demonstration_video.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "Incline Bench Press (Barbell)": {
    "file": "incline-bench-press",
    "author": "FitnessScape",
    "page": "https://commons.wikimedia.org/wiki/File:Incline_press_-_exercise_demonstration_video.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "Dumbbell Press": {
    "file": "dumbbell-press",
    "author": "Gantner626",
    "page": "https://commons.wikimedia.org/wiki/File:Video_showing_how_to_perform_the_dumbbell_bench_press_and_the_dumbbell_incline_bench_press.webm",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "Incline Dumbbell Press": {
    "file": "incline-dumbbell-press",
    "author": "Gantner626",
    "page": "https://commons.wikimedia.org/wiki/File:Video_showing_how_to_perform_the_dumbbell_bench_press_and_the_dumbbell_incline_bench_press.webm",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "Chest Press Machine": {
    "file": "chest-press-machine",
    "author": "Centers for Disease Control and Prevention",
    "page": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Chest_Press.webm",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Chest_Press.webm"
  },
  "Push-ups": {
    "file": "push-ups",
    "author": "Wensceslao",
    "page": "https://commons.wikimedia.org/wiki/File:Pushups.gif",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "Deadlift": {
    "file": "deadlift",
    "author": "FitnessScape",
    "page": "https://commons.wikimedia.org/wiki/File:Deadlift_-_exercise_demonstration_video.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "Pull-ups": {
    "file": "pull-ups",
    "author": "FitnessScape",
    "page": "https://commons.wikimedia.org/wiki/File:Pull-ups_-_exercise_demonstration_video.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "Bent Over Row (Barbell)": {
    "file": "barbell-row",
    "author": "FitnessScape",
    "page": "https://commons.wikimedia.org/wiki/File:Bent-over_row_-_exercise_demonstration_video.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "T-Bar Rows": {
    "file": "t-bar-rows",
    "author": "FitnessScape",
    "page": "https://commons.wikimedia.org/wiki/File:How_to_do_a_T-Bar_Row_in_strength_training_workouts.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "Back Extension (Hyperextension)": {
    "file": "back-extension",
    "author": "Mohamed Ouda",
    "page": "https://commons.wikimedia.org/wiki/File:800px-RomanChairBackExtension.gif",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  "Barbell Squats": {
    "file": "barbell-squats",
    "author": "FitnessScape",
    "page": "https://commons.wikimedia.org/wiki/File:Squat_-_exercise_demonstration_video.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "Leg Press": {
    "file": "leg-press",
    "author": "Centers for Disease Control and Prevention",
    "page": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Seated_Leg_Press.webm",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Seated_Leg_Press.webm"
  },
  "Leg Extension Machine": {
    "file": "leg-extension-machine",
    "author": "Centers for Disease Control and Prevention",
    "page": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Leg_Extension.webm",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Leg_Extension.webm"
  },
  "Leg Curls Machine": {
    "file": "leg-curls",
    "author": "Centers for Disease Control and Prevention",
    "page": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Leg_Curl.webm",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Leg_Curl.webm"
  },
  "Overhead Press (Barbell)": {
    "file": "overhead-press",
    "author": "FitnessScape",
    "page": "https://commons.wikimedia.org/wiki/File:Shoulder_press_-_exercise_demonstration_video.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "Barbell Curl": {
    "file": "barbell-curl",
    "author": "Colossus Fitness",
    "page": "https://commons.wikimedia.org/wiki/File:Video_of_EZ_Bar_Curl_and_Straight_Bar_Curl.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "Ez Bar Curls": {
    "file": "ez-bar-curl",
    "author": "Colossus Fitness",
    "page": "https://commons.wikimedia.org/wiki/File:Video_of_EZ_Bar_Curl_and_Straight_Bar_Curl.webm",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  "Dumbbell Curl": {
    "file": "dumbbell-curl",
    "author": "Centers for Disease Control and Prevention",
    "page": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_Home_-_Bicep_Curls.webm",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_Home_-_Bicep_Curls.webm"
  },
  "Preacher Curls": {
    "file": "preacher-curl",
    "author": "Mohamed Ouda",
    "page": "https://commons.wikimedia.org/wiki/File:PreacherBenchBicepsCurl.gif",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  "Leg Raises": {
    "file": "leg-raises",
    "author": "Wensceslao",
    "page": "https://commons.wikimedia.org/wiki/File:Legraises.gif",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "Ab Crunches Machine": {
    "file": "ab-crunches-machine",
    "author": "Centers for Disease Control and Prevention",
    "page": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Abdominal_Machine.webm",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_the_Gym_-_Abdominal_Machine.webm"
  }
};

export function getExerciseDemo(name: string) {
  return Object.hasOwn(DEMOS, name) ? DEMOS[name] : undefined;
}
