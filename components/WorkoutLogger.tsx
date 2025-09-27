
import React, { useState } from 'react';
import { Exercise, WorkoutLog, CustomRoutine } from '../types';
import ExerciseLogger from './ExerciseLogger';
import RoutineEditor from './RoutineEditor';

interface WorkoutLoggerProps {
  onSave: (log: WorkoutLog) => void;
  routines: CustomRoutine[];
  onAddRoutine: (routine: Omit<CustomRoutine, 'id'>) => CustomRoutine;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ onSave, routines, onAddRoutine }) => {
  const [selectedRoutine, setSelectedRoutine] = useState<CustomRoutine | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState(false);

  const handleRoutineSelect = (routine: CustomRoutine) => {
    setSelectedRoutine(routine);
    setExercises(routine.exercises.map(name => ({ name, sets: [{ id: Date.now().toString(), weight: '', reps: '' }] })));
  };

  const handleRoutineSave = (newRoutineData: Omit<CustomRoutine, 'id'>) => {
    const newRoutine = onAddRoutine(newRoutineData);
    handleRoutineSelect(newRoutine);
    setIsRoutineEditorOpen(false);
  };

  const handleSetChange = (exerciseName: string, updatedSets: { id: string; weight: string; reps: string }[]) => {
    setExercises(prev => prev.map(ex => ex.name === exerciseName ? { ...ex, sets: updatedSets } : ex));
  };
  
  const handleSaveWorkout = () => {
    if (!selectedRoutine) return;
    const newLog: WorkoutLog = {
      id: new Date().toISOString(),
      date: new Date().toISOString(),
      routineName: selectedRoutine.name,
      exercises: exercises.filter(e => e.sets.some(s => s.weight && s.reps)),
    };
    if (newLog.exercises.length > 0) {
      onSave(newLog);
      setExercises([]);
      setSelectedRoutine(null);
    } else {
      alert("Please log at least one set for an exercise before saving.");
    }
  };

  return (
    <>
      <div className="bg-background-light p-6 rounded-lg shadow-xl space-y-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary">Log Your Workout</h2>
          <p className="text-text-secondary mt-1">Select a routine or create a new one to begin.</p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">1. Choose Your Routine</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {routines.map(routine => (
              <button
                key={routine.id}
                onClick={() => handleRoutineSelect(routine)}
                className={`flex flex-col items-center justify-center text-center p-3 rounded-lg border-2 transition-all duration-200 h-28
                  ${selectedRoutine?.id === routine.id ? 'bg-brand-secondary border-brand-primary text-white' : 'bg-card-dark border-border-color text-text-secondary hover:border-brand-light'}`}
              >
                <span className="text-sm font-bold">{routine.name}</span>
                <span className="text-xs text-gray-400 mt-1">{routine.exercises.length} exercises</span>
              </button>
            ))}
            <button
              onClick={() => setIsRoutineEditorOpen(true)}
              className="flex flex-col items-center justify-center text-center p-3 rounded-lg border-2 border-dashed border-border-color text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all duration-200 h-28"
            >
              <PlusIcon />
              <span className="text-sm font-medium mt-2">New Routine</span>
            </button>
          </div>
        </div>
        
        {selectedRoutine && exercises.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">2. Log Your Sets for <span className="text-brand-light">{selectedRoutine.name}</span></h3>
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

        {selectedRoutine && (
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
      <RoutineEditor
        isOpen={isRoutineEditorOpen}
        onClose={() => setIsRoutineEditorOpen(false)}
        onSave={handleRoutineSave}
      />
    </>
  );
};

export default WorkoutLogger;
