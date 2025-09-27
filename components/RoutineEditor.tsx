import React, { useState, useMemo, useEffect } from 'react';
import { CustomRoutine, WorkoutLog } from '../types';
import { MASTER_EXERCISE_LIST } from '../constants';

interface RoutineEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: Omit<CustomRoutine, 'id'>) => void;
  logs: WorkoutLog[];
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const generateSuggestions = (firstExercise: string, logs: WorkoutLog[]): string[] => {
    const coOccurrenceCount: Record<string, number> = {};

    const relevantLogs = logs.filter(log => 
        log.exercises.some(ex => ex.name === firstExercise)
    );

    for (const log of relevantLogs) {
        for (const exercise of log.exercises) {
            if (exercise.name !== firstExercise) {
                coOccurrenceCount[exercise.name] = (coOccurrenceCount[exercise.name] || 0) + 1;
            }
        }
    }

    const sortedSuggestions = Object.entries(coOccurrenceCount)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);

    return sortedSuggestions.slice(0, 8); // Return top 8 suggestions
};


const RoutineEditor: React.FC<RoutineEditorProps> = ({ isOpen, onClose, onSave, logs }) => {
  const [routineName, setRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (selectedExercises.size === 1) {
        const firstExercise = Array.from(selectedExercises)[0];
        const newSuggestions = generateSuggestions(firstExercise, logs);
        setSuggestions(newSuggestions);
    } else {
        setSuggestions([]);
    }
  }, [selectedExercises, logs]);

  const unselectedSuggestions = useMemo(() => {
    return suggestions.filter(suggestion => !selectedExercises.has(suggestion));
  }, [suggestions, selectedExercises]);

  const handleToggleExercise = (exercise: string) => {
    setSelectedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exercise)) {
        newSet.delete(exercise);
      } else {
        newSet.add(exercise);
      }
      return newSet;
    });
  };

  const handleAddAllSuggestions = () => {
    setSelectedExercises(prevSelected => new Set([...prevSelected, ...unselectedSuggestions]));
  };

  const handleSave = () => {
    if (routineName.trim() && selectedExercises.size > 0) {
      onSave({
        name: routineName.trim(),
        exercises: Array.from(selectedExercises)
      });
      // Reset state for next time
      setRoutineName('');
      setSelectedExercises(new Set());
      setSearchTerm('');
    } else {
        alert("Please provide a routine name and select at least one exercise.");
    }
  };

  const filteredExercises = useMemo(() => {
    if (!searchTerm) {
      return MASTER_EXERCISE_LIST;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered: Record<string, string[]> = {};
    for (const category in MASTER_EXERCISE_LIST) {
      const matchingExercises = MASTER_EXERCISE_LIST[category].filter(exercise =>
        exercise.toLowerCase().includes(lowercasedFilter)
      );
      if (matchingExercises.length > 0) {
        filtered[category] = matchingExercises;
      }
    }
    return filtered;
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-background-light w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-border-color flex-shrink-0">
          <h2 className="text-xl font-bold text-text-primary">Create New Routine</h2>
        </header>

        <main className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="routineName" className="block text-sm font-medium text-text-secondary mb-1">Routine Name</label>
            <input
              id="routineName"
              type="text"
              value={routineName}
              onChange={e => setRoutineName(e.target.value)}
              placeholder="e.g., Push Day, Leg Power"
              className="w-full bg-background-dark border-2 border-border-color rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary transition-colors"
            />
          </div>
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-text-secondary mb-1">Search Exercises</label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search for an exercise..."
              className="w-full bg-background-dark border-2 border-border-color rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary transition-colors"
            />
          </div>

          {unselectedSuggestions.length > 0 && (
            <div className="border-t border-border-color pt-4 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h3 className="text-md font-semibold text-brand-light">Smart Suggestions</h3>
                        <p className="text-xs text-text-secondary mt-1">Based on your history with <span className="font-bold text-text-primary">'{Array.from(selectedExercises)[0]}'</span>.</p>
                    </div>
                    {unselectedSuggestions.length > 0 && (
                         <button
                            onClick={handleAddAllSuggestions}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-brand-primary/20 text-brand-light hover:bg-brand-primary/40 transition-colors"
                        >
                            <PlusIcon />
                            <span>Add All</span>
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {unselectedSuggestions.map(exercise => (
                        <button
                            key={exercise}
                            onClick={() => handleToggleExercise(exercise)}
                            className="p-2 rounded-md text-sm bg-card-dark hover:bg-gray-600 transition-colors flex items-center gap-2 text-text-secondary hover:text-text-primary"
                        >
                            <PlusIcon />
                            <span>{exercise}</span>
                        </button>
                    ))}
                </div>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(filteredExercises).map(([category, exercises]) => (
              <div key={category}>
                <h3 className="text-md font-semibold text-brand-light mb-2">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {exercises.map(exercise => (
                    <button
                      key={exercise}
                      onClick={() => handleToggleExercise(exercise)}
                      className={`text-left p-2 rounded-md text-sm transition-colors ${selectedExercises.has(exercise) ? 'bg-brand-secondary text-white' : 'bg-card-dark hover:bg-gray-600'}`}
                    >
                      {exercise}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
        
        <footer className="p-4 border-t border-border-color flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-card-dark hover:bg-gray-600 text-text-primary transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white transition-colors disabled:opacity-50"
            disabled={!routineName.trim() || selectedExercises.size === 0}
          >
            Save Routine
          </button>
        </footer>
      </div>
    </div>
  );
};

export default RoutineEditor;