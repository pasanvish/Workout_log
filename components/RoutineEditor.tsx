import React, { useState, useMemo, useEffect } from 'react';
import { CustomRoutine, WorkoutLog, CustomExercise } from '../types';
import ExerciseLibrary from './ExerciseLibrary';
import ModalFrame from './ModalFrame';
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

  if (!isOpen) return null;

  return (
    <>
      <ModalFrame title="New routine" onClose={handleClose} wide footer={
        <>
          <span className="mr-auto text-xs text-text-secondary" role="status">{selectedExercises.size} selected</span>
          <button type="button" onClick={handleClose} className="panel-action">Cancel</button>
          <button type="button" onClick={handleSave} className="panel-action panel-action-primary disabled:opacity-40"
            disabled={!routineName.trim() || selectedExercises.size === 0}>Save routine</button>
        </>
      }>
        <div className="space-y-4">
          <label className="block rounded-xl border border-border-color/70 bg-background-dark p-3 text-xs font-semibold text-text-secondary">
            Routine name
            <input value={routineName} onChange={event => setRoutineName(event.target.value)} placeholder="e.g., Push day"
              className="track-input mt-1.5 w-full" />
          </label>
          {suggestionAnchor && unselectedSuggestions.length > 0 && (
            <section className="tracking-panel">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Often paired with {suggestionAnchor}</h3>
                <button type="button" onClick={handleAddAllSuggestions} className="category-chip">Add all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {unselectedSuggestions.map(exercise => (
                  <button type="button" key={exercise} onClick={() => handleToggleExercise(exercise)} className="category-chip selection-chip">
                    <PlusIcon /> {exercise}
                  </button>
                ))}
              </div>
            </section>
          )}
          <ExerciseLibrary search={searchTerm} onSearch={setSearchTerm} onCreate={() => setCreateExerciseModalOpen(true)}
            customExercises={customExercises} selected={selectedExercises} onToggle={handleToggleExercise} />
        </div>
      </ModalFrame>
      <CreateExerciseModal isOpen={isCreateExerciseModalOpen} onClose={() => setCreateExerciseModalOpen(false)}
        onSave={handleCreateExerciseSave} initialValue={searchTerm} customExercises={customExercises} />
    </>
  );
};

export default RoutineEditor;
