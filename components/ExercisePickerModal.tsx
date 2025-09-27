import React, { useState, useMemo } from 'react';
import { CustomExercise, Exercise } from '../types';
import { MASTER_EXERCISE_LIST } from '../constants';
import CreateExerciseModal from './CreateExerciseModal';

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercises: (exerciseNames: string[]) => void;
  customExercises: CustomExercise[];
  onAddCustomExercise: (exercise: Omit<CustomExercise, 'id'>) => CustomExercise;
  currentExercises: Exercise[];
}

const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({ isOpen, onClose, onAddExercises, customExercises, onAddCustomExercise, currentExercises }) => {
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateExerciseModalOpen, setCreateExerciseModalOpen] = useState(false);

  const currentExerciseNames = useMemo(() => new Set(currentExercises.map(ex => ex.name)), [currentExercises]);

  const combinedExerciseList = useMemo(() => {
    const combined = JSON.parse(JSON.stringify(MASTER_EXERCISE_LIST));
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
  
  const resetState = () => {
    setSelectedExercises(new Set());
    setSearchTerm('');
  };

  const handleAdd = () => {
    if (selectedExercises.size > 0) {
      onAddExercises(Array.from(selectedExercises));
      resetState();
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

  const filteredExercises = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered: Record<string, string[]> = {};
    for (const category in combinedExerciseList) {
      const allExercisesInCategory = combinedExerciseList[category];
      const matchingExercises = allExercisesInCategory.filter(exercise => 
        !currentExerciseNames.has(exercise) &&
        (!searchTerm || exercise.toLowerCase().includes(lowercasedFilter))
      );
      if (matchingExercises.length > 0) {
        filtered[category] = matchingExercises;
      }
    }
    return filtered;
  }, [searchTerm, combinedExerciseList, currentExerciseNames]);

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
          <h2 className="text-xl font-bold text-text-primary">Add Exercises to Session</h2>
        </header>

        <main className="p-6 space-y-4 overflow-y-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-grow">
              <label htmlFor="search-add" className="block text-sm font-medium text-text-secondary mb-1">Search Exercises</label>
              <input
                id="search-add"
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
            {Object.keys(filteredExercises).length === 0 && (
                <div className="text-center text-text-secondary p-4 bg-background-dark rounded-md">
                    <p>No available exercises found.</p>
                     {searchTerm && <button onClick={() => setCreateExerciseModalOpen(true)} className="text-brand-light font-semibold mt-2">
                        Create "{searchTerm}"?
                    </button>}
                </div>
            )}
          </div>
        </main>
        
        <footer className="p-4 border-t border-border-color flex justify-end gap-3 flex-shrink-0">
          <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-card-dark hover:bg-gray-600 text-text-primary transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white transition-colors disabled:opacity-50"
            disabled={selectedExercises.size === 0}
          >
            Add {selectedExercises.size > 0 ? selectedExercises.size : ''} Exercise{selectedExercises.size === 1 ? '' : 's'}
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

export default ExercisePickerModal;
