import React from 'react';
import { Exercise, Set } from '../types';

interface ExerciseLoggerProps {
  exercise: Exercise;
  onSetChange: (exerciseName: string, sets: Set[]) => void;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);


const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({ exercise, onSetChange }) => {
  
  const handleInputChange = (setId: string, field: 'weight' | 'reps', value: string) => {
    const updatedSets = exercise.sets.map(set =>
      set.id === setId ? { ...set, [field]: value.replace(/[^0-9.]/g, '') } : set
    );
    onSetChange(exercise.name, updatedSets);
  };

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1] || { weight: '', reps: '' };
    const newSet = { id: Date.now().toString(), weight: lastSet.weight, reps: lastSet.reps };
    onSetChange(exercise.name, [...exercise.sets, newSet]);
  };

  const removeSet = (setId: string) => {
    if (exercise.sets.length > 1) {
      const updatedSets = exercise.sets.filter(set => set.id !== setId);
      onSetChange(exercise.name, updatedSets);
    }
  };

  return (
    <div className="bg-card-dark p-4 rounded-lg border border-border-color">
      <h4 className="text-md font-semibold text-brand-light mb-4">{exercise.name}</h4>
      <div className="space-y-3">
        {exercise.sets.map((set, index) => (
          <div key={set.id} className="flex items-center gap-4">
             <span className="font-mono text-sm text-text-secondary w-12">Set {index + 1}</span>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="number"
                placeholder="0"
                value={set.weight}
                onChange={(e) => handleInputChange(set.id, 'weight', e.target.value)}
                className="w-full bg-background-light border border-border-color rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                aria-label={`Weight for set ${index + 1}`}
              />
              <span className="text-sm text-text-secondary">kg</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="number"
                placeholder="0"
                value={set.reps}
                onChange={(e) => handleInputChange(set.id, 'reps', e.target.value)}
                className="w-full bg-background-light border border-border-color rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                 aria-label={`Reps for set ${index + 1}`}
              />
               <span className="text-sm text-text-secondary">reps</span>
            </div>
            <button 
                onClick={() => removeSet(set.id)} 
                className={`text-gray-500 hover:text-red-500 p-2 transition-opacity ${exercise.sets.length <= 1 ? 'opacity-0 cursor-default' : 'opacity-100'}`}
                disabled={exercise.sets.length <= 1}
                aria-label={`Remove set ${index + 1}`}
            >
                <TrashIcon/>
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addSet}
        className="mt-4 flex items-center space-x-2 text-sm text-brand-primary hover:text-brand-light font-semibold transition-colors"
      >
        <PlusIcon />
        <span>Add Set</span>
      </button>
    </div>
  );
};

export default ExerciseLogger;