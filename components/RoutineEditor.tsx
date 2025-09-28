import React, { useState, useMemo, useEffect } from 'react';
import { CustomRoutine, WorkoutLog, CustomExercise } from '../types';
import { MASTER_EXERCISE_LIST } from '../constants';
import CreateExerciseModal from './CreateExerciseModal';

interface RoutineEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: Omit<CustomRoutine, 'id'>) => void;
  logs: WorkoutLog[];
  routines: CustomRoutine[];
  customExercises: CustomExercise[];
  onAddCustomExercise: (exercise: Omit<CustomExercise, 'id'>) => CustomExercise;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const generateSuggestions = (firstExercise: string, logs: WorkoutLog[], routines: CustomRoutine[]): string[] => {
    const coOccurrenceCount: Record<string, number> = {};

    // 1. Analyze workout logs
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

    // 2. Analyze existing routines
    const relevantRoutines = routines.filter(routine =>
        routine.exercises.includes(firstExercise)
    );

    for (const routine of relevantRoutines) {
        for (const exercise of routine.exercises) {
            if (exercise !== firstExercise) {
                // Give a higher weight to routines to make them appear more prominently
                coOccurrenceCount[exercise] = (coOccurrenceCount[exercise] || 0) + 2; 
            }
        }
    }

    const sortedSuggestions = Object.entries(coOccurrenceCount)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    
    const uniqueSuggestions = [...new Set(sortedSuggestions)];

    return uniqueSuggestions.slice(0, 8); // Return top 8 suggestions
};


const RoutineEditor: React.FC<RoutineEditorProps> = ({ isOpen, onClose, onSave, logs, routines, customExercises, onAddCustomExercise }) => {
  const [routineName, setRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionAnchor, setSuggestionAnchor] = useState<string | null>(null);
  const [isCreateExerciseModalOpen, setCreateExerciseModalOpen] = useState(false);

  const combinedExerciseList = useMemo(() => {
    // FIX: Explicitly cast the type after JSON.parse to avoid it being inferred as `any`.
    // This ensures type safety throughout the component.
    const combined = JSON.parse(JSON.stringify(MASTER_EXERCISE_LIST)) as Record<string, string[]>;
    customExercises.forEach(ex => {
        if (!combined[ex.category]) {
            combined[ex.category] = [];
        }
        if (!combined[ex.category].includes(ex.name)) {
            combined[ex.category].push(ex.name);
        }
    });
    return combined;
  }, [customExercises]);


  useEffect(() => {
    const exercises = Array.from(selectedExercises);
    const currentAnchor = suggestionAnchor;

    // Case 1: First exercise is selected. Set it as the anchor.
    if (exercises.length > 0 && !currentAnchor) {
      const newAnchor = exercises[0];
      setSuggestionAnchor(newAnchor);
      const newSuggestions = generateSuggestions(newAnchor, logs, routines);
      setSuggestions(newSuggestions);
    } 
    // Case 2: Anchor was removed from selection.
    else if (currentAnchor && !selectedExercises.has(currentAnchor)) {
      // If other exercises remain, pick a new anchor.
      if (exercises.length > 0) {
        const newAnchor = exercises[0];
        setSuggestionAnchor(newAnchor);
        const newSuggestions = generateSuggestions(newAnchor, logs, routines);
        setSuggestions(newSuggestions);
      } else {
        // No exercises left, clear everything.
        setSuggestionAnchor(null);
        setSuggestions([]);
      }
    }
  }, [selectedExercises, logs, routines, suggestionAnchor]);


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

  const resetState = () => {
    setRoutineName('');
    setSelectedExercises(new Set());
    setSearchTerm('');
    setSuggestionAnchor(null);
    setSuggestions([]);
  };

  const handleSave = () => {
    if (routineName.trim() && selectedExercises.size > 0) {
      onSave({
        name: routineName.trim(),
        exercises: Array.from(selectedExercises)
      });
      resetState();
    } else {
        alert("Please provide a routine name and select at least one exercise.");
    }
  };
  
  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCreateExerciseSave = (name: string, category: string) => {
    const newExercise = onAddCustomExercise({ name, category });
    handleToggleExercise(newExercise.name);
    setCreateExerciseModalOpen(false);
  };

  // FIX: Explicitly typing `filteredExercises` ensures that any issues in its dependencies
  // are caught and that its value is correctly typed as `Record<string, string[]>`,
  // which resolves downstream errors.
  const filteredExercises: Record<string, string[]> = useMemo(() => {
    if (!searchTerm) {
      return combinedExerciseList;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered: Record<string, string[]> = {};
    for (const category in combinedExerciseList) {
      const matchingExercises = combinedExerciseList[category].filter(exercise =>
        exercise.toLowerCase().includes(lowercasedFilter)
      );
      if (matchingExercises.length > 0) {
        filtered[category] = matchingExercises;
      }
    }
    return filtered;
  }, [searchTerm, combinedExerciseList]);

  if (!isOpen) return null;

  return (
    <>
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={handleClose}
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
          <div className="flex gap-2 items-end">
             <div className="flex-grow">
                <label htmlFor="search" className="block text-sm font-medium text-text-secondary mb-1">Search Exercises</label>
                <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search or add new..."
                className="w-full bg-background-dark border-2 border-border-color rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary transition-colors"
                />
            </div>
            <button onClick={() => setCreateExerciseModalOpen(true)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-card-dark hover:bg-gray-600 text-text-primary transition-colors h-[40px] flex-shrink-0">
                Create New
            </button>
          </div>

          {suggestionAnchor && unselectedSuggestions.length > 0 && (
            <div className="border-t border-border-color pt-4 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h3 className="text-md font-semibold text-brand-light">Smart Suggestions</h3>
                        <p className="text-xs text-text-secondary mt-1">Based on your history with <span className="font-bold text-text-primary">'{suggestionAnchor}'</span>.</p>
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
             {Object.keys(filteredExercises).length === 0 && searchTerm && (
                <div className="text-center text-text-secondary p-4 bg-background-dark rounded-md">
                    <p>No exercises found for "{searchTerm}".</p>
                    <button onClick={() => setCreateExerciseModalOpen(true)} className="text-brand-light font-semibold mt-2">
                        Create it now?
                    </button>
                </div>
            )}
          </div>
        </main>
        
        <footer className="p-4 border-t border-border-color flex justify-end gap-3 flex-shrink-0">
          <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-card-dark hover:bg-gray-600 text-text-primary transition-colors">
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
    <CreateExerciseModal
        isOpen={isCreateExerciseModalOpen}
        onClose={() => setCreateExerciseModalOpen(false)}
        onSave={handleCreateExerciseSave}
        initialValue={searchTerm}
    />
    </>
  );
};

export default RoutineEditor;
