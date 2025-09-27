import React, { useState, useMemo } from 'react';
import { WorkoutDay, Exercise, WorkoutLog } from '../types';
import { WORKOUT_ROUTINES } from '../constants';
import ExerciseLogger from './ExerciseLogger';

interface WorkoutLoggerProps {
  onSave: (log: WorkoutLog) => void;
}

const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ onSave }) => {
  const [selectedDay, setSelectedDay] = useState<WorkoutDay>(WorkoutDay.BicepsTricepsShoulders);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const availableExercises = useMemo(() => WORKOUT_ROUTINES[selectedDay], [selectedDay]);

  const handleDayChange = (day: WorkoutDay) => {
    setSelectedDay(day);
    setExercises([]); // Reset selected exercises when day changes
  };

  const handleExerciseToggle = (exerciseName: string) => {
    const isSelected = exercises.some(ex => ex.name === exerciseName);
    if (isSelected) {
      setExercises(prev => prev.filter(ex => ex.name !== exerciseName));
    } else {
      setExercises(prev => [...prev, { name: exerciseName, sets: [{ id: Date.now().toString(), weight: '', reps: '' }] }]);
    }
  };

  const handleSetChange = (exerciseName: string, updatedSets: { id: string; weight: string; reps: string }[]) => {
    setExercises(prev => prev.map(ex => ex.name === exerciseName ? { ...ex, sets: updatedSets } : ex));
  };
  
  const handleSaveWorkout = () => {
    const newLog: WorkoutLog = {
      id: new Date().toISOString(),
      date: new Date().toISOString(),
      day: selectedDay,
      exercises: exercises.filter(e => e.sets.some(s => s.weight && s.reps)),
    };
    if (newLog.exercises.length > 0) {
      onSave(newLog);
      setExercises([]);
    } else {
      alert("Please log at least one set for an exercise before saving.");
    }
  };

  return (
    <div className="bg-background-light p-6 rounded-lg shadow-xl space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary">Log Your Workout</h2>
        <p className="text-text-secondary mt-1">Select a workout day and the exercises you performed.</p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">1. Select Workout Day</h3>
        <div className="flex flex-wrap gap-2 rounded-lg bg-card-dark p-2">
          {Object.values(WorkoutDay).map(day => (
            <button
              key={day}
              onClick={() => handleDayChange(day)}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-background-light min-w-[150px] ${
                selectedDay === day ? 'bg-brand-primary text-white shadow-lg' : 'bg-background-light text-text-secondary hover:bg-gray-600'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">2. Select Exercises</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableExercises.map(exerciseName => {
            const isSelected = exercises.some(ex => ex.name === exerciseName);
            return (
              <button
                key={exerciseName}
                onClick={() => handleExerciseToggle(exerciseName)}
                className={`flex items-center justify-center text-center p-3 rounded-lg border-2 transition-all duration-200 h-24
                  ${isSelected ? 'bg-brand-secondary border-brand-primary text-white' : 'bg-card-dark border-border-color text-text-secondary hover:border-brand-light'}`}
              >
                <span className="text-sm font-medium">{exerciseName}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      {exercises.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">3. Log Your Sets</h3>
          <div className="space-y-4">
            {exercises.map(exercise => (
              <ExerciseLogger 
                key={exercise.name}
                exercise={exercise}
                onSetChange={handleSetChange}
              />
            ))}
          </div>
        </div>
      )}

      {exercises.length > 0 && (
         <button
          onClick={handleSaveWorkout}
          className="w-full bg-gradient-to-r from-brand-primary to-cyan-500 hover:from-brand-secondary hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-brand-primary/40 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Save Workout Session</span>
        </button>
      )}
    </div>
  );
};

export default WorkoutLogger;