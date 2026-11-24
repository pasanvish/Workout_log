
# 💪 Gym Weight Logger

A sleek, modern, and offline-first web application to log your gym training sessions. Track your progress for different workout days and exercises over time with an intuitive, responsive interface.

![Gym Weight Logger Screenshot](https://storage.googleapis.com/aistudio-project-files/55b38a7c-50a1-4228-86d3-21c8340d869a/d0107e32-a6f6-455c-a50e-5a50787e91d8)

## 📲 Get the app

- **Android:** [Download GymLogger.apk](https://github.com/pasanvish/Workout_log/releases/latest/download/GymLogger.apk), open it on your phone and tap Install (allow installs from your browser if asked).
- **iPhone / any device:** open [pasanvish.github.io/Workout_log](https://pasanvish.github.io/Workout_log/) and use *Add to Home Screen*.

## ✨ Key Features

- **Intuitive Workout Logging**: A step-by-step process to log your workout day, select exercises, and record sets with weight and reps.
- **Detailed History**: View a chronological log of all your past workout sessions in beautifully designed cards.
- **Progress Visualization**: Track your strength gains with an interactive line chart that visualizes your max weight for any exercise over time.
- **Responsive Design**: Fully optimized for both desktop and mobile devices, so you can log your workout right at the gym.
- **Offline First**: All data is stored directly in your browser's `localStorage`. The app works entirely offline, and your data never leaves your device.
- **Flexible set logging**: Track weighted sets, bodyweight reps with optional added load, and timed holds. Planks have a stopwatch, and the rest timer stays available during the workout.
- **Repeat a workout**: Start from your last exercise list and set counts. Previous results appear as references while you log new sets.
- **Data Portability**: Easily import and export your entire workout history as a JSON file for backup or migration.
- **Pre-defined Routines**: Comes with a pre-configured list of common exercises for "Biceps, Triceps & Shoulders", "Chest & Back", and "Legs" days.

## 🚀 Tech Stack

This project is built with a modern frontend stack, focusing on simplicity and performance.

- **Framework**: [React](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charting**: [Recharts](https://recharts.org/)
- **Build**: [Vite](https://vitejs.dev/); Android app via [Capacitor](https://capacitorjs.com/)

## 🛠️ Getting Started

This is a client-side-only application with no backend.

```bash
git clone https://github.com/pasanvish/Workout_log.git
cd Workout_log
npm install
npm run dev
```

Pushing to `main` deploys the website. Pushing a `v*` tag builds a signed Android APK and attaches it to a GitHub Release.

## 📁 File Structure

The project is organized into a clear and logical structure:

```
.
├── 📄 index.html          # Main HTML entry point
├── 📁 components/
│   ├── 📄 WorkoutLogger.tsx    # Component for logging a new session
│   ├── 📄 WorkoutHistory.tsx   # Component for displaying past logs and charts
│   └── 📄 ExerciseLogger.tsx    # Sub-component for logging sets of an exercise
├── 📄 App.tsx             # Main application component (state management & routing)
├── 📄 index.tsx           # React root rendering
├── 📄 constants.ts        # App-wide constants (e.g., workout routines)
├── 📄 types.ts            # TypeScript type definitions
└── 📄 README.md           # You are here!
```

## 💾 Data Management

All your workout data is stored in your browser's `localStorage` under the key `workoutLogs`.

- **Privacy**: Your data is 100% private and never sent to any server.
- **Backup**: It is highly recommended to use the **Export** feature regularly to back up your data. Choose **Full backup (.json)** to export the active profile’s workouts, routines, measurements, and appearance. Android opens a Save As dialog.
- **Restore**: Use **Import backup** to restore a Gym Logger JSON file into the selected profile. Existing entries keep their values. **Workout report (.html)** exports a readable report that can be opened and printed in a browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/pasanvish/Workout_log/issues).

## 📄 License

This project is licensed under the MIT License.


### Interface and Android updates

The web and Android apps share the React interface. The 61 built-in exercise cards display bundled illustrations, short descriptions, and primary and secondary muscle targets. Exercise guides show multiple positions where available.

Exercise data by [RepDB (repdb.co)](https://repdb.co), used in the app under the [RepDB Free Tier License](https://github.com/RepDB/exercise-dataset/blob/main/LICENSE-DATA.md). Overhead press and triceps dip artwork by [Bryl Lim and Everkinetic](https://github.com/bryllim/workout-guide), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and converted to WebP for this app.

- `npm run typecheck` checks TypeScript.
- `npm run android:sync` builds the web interface and copies it into the Android project.
- `npm run android:build` also builds a release APK locally (requires Java 21 and the Android SDK). Supply the existing signing environment variables to create an update compatible with installed copies.

The Android APK workflow now runs for interface changes on pull requests and pushes to `main`, as well as version tags and manual runs. GitHub builds use the repository's existing signing secrets. Download the `GymLogger-apk` artifact from a successful run, or use the release download for a version tag. Install the signed APK over the existing app to retain local data; syncing assets alone does not update an installed app.
