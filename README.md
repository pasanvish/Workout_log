
# 💪 Gym Weight Logger

A sleek, modern, and offline-first web application to log your gym training sessions. Track your progress for different workout days and exercises over time with an intuitive, responsive interface.

![Gym Weight Logger Screenshot](https://storage.googleapis.com/aistudio-project-files/55b38a7c-50a1-4228-86d3-21c8340d869a/d0107e32-a6f6-455c-a50e-5a50787e91d8)

## ✨ Key Features

- **Intuitive Workout Logging**: A step-by-step process to log your workout day, select exercises, and record sets with weight and reps.
- **Detailed History**: View a chronological log of all your past workout sessions in beautifully designed cards.
- **Progress Visualization**: Track your strength gains with an interactive line chart that visualizes your max weight for any exercise over time.
- **Responsive Design**: Fully optimized for both desktop and mobile devices, so you can log your workout right at the gym.
- **Offline First**: All data is stored directly in your browser's `localStorage`. The app works entirely offline, and your data never leaves your device.
- **Data Portability**: Easily import and export your entire workout history as a JSON file for backup or migration.
- **Pre-defined Routines**: Comes with a pre-configured list of common exercises for "Biceps, Triceps & Shoulders", "Chest & Back", and "Legs" days.

## 🚀 Tech Stack

This project is built with a modern frontend stack, focusing on simplicity and performance.

- **Framework**: [React](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charting**: [Recharts](https://recharts.org/)
- **Build**: No build step needed! It uses modern browser features like ES Modules and `importmap`.

## 🛠️ Getting Started

This is a client-side-only application. There's no backend or build process required.

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/gym-logger.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd gym-logger
    ```
3.  Open the `index.html` file in your favorite web browser. That's it!

You can also use a simple local server (like the Live Server extension in VS Code) for a slightly better development experience.

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
- **Backup**: It is highly recommended to use the **Export** feature regularly to back up your data. This downloads a `gym-workout-logs-YYYY-MM-DD.json` file to your computer.
- **Restore**: You can restore your data on any device or browser using the **Import** feature and selecting a previously exported JSON file.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/gym-logger/issues).

## 📄 License

This project is licensed under the MIT License.
