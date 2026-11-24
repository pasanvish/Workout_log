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

export const newSetId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// text-base (16px) stops iOS zooming on focus; inputMode brings up the number pad.
const inputClass = "w-full min-w-0 bg-background-dark border-2 border-border-color rounded-lg px-3 py-2.5 text-base text-center font-semibold focus:outline-none focus:border-brand-primary transition-colors";

const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({ exercise, onSetChange }) => {

  const handleInputChange = (setId: string, field: 'weight' | 'reps', value: string) => {
    const clean = field === 'reps' ? value.replace(/\D/g, '') : value.replace(',', '.').replace(/[^0-9.]/g, '');
    onSetChange(exercise.name, exercise.sets.map(set => set.id === setId ? { ...set, [field]: clean } : set));
  };

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1] || { weight: '', reps: '' };
    onSetChange(exercise.name, [...exercise.sets, { id: newSetId(), weight: lastSet.weight, reps: lastSet.reps }]);
  };

  const removeSet = (setId: string) => {
    if (exercise.sets.length > 1) {
      onSetChange(exercise.name, exercise.sets.filter(set => set.id !== setId));
    }
  };

  return (
    <div>
      <div className="grid grid-cols-[2.5rem_1fr_1fr_2.75rem] gap-2 items-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Set</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary text-center">kg</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary text-center">Reps</span>
        <span />
        {exercise.sets.map((set, index) => (
          <React.Fragment key={set.id}>
            <span className="font-mono text-base font-bold text-text-secondary text-center">{index + 1}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={set.weight}
              onChange={(e) => handleInputChange(set.id, 'weight', e.target.value)}
              className={inputClass}
              aria-label={`${exercise.name} set ${index + 1} weight in kg`}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={set.reps}
              onChange={(e) => handleInputChange(set.id, 'reps', e.target.value)}
              className={inputClass}
              aria-label={`${exercise.name} set ${index + 1} reps`}
            />
            <button
              onClick={() => removeSet(set.id)}
              className={`h-11 w-11 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors ${exercise.sets.length <= 1 ? 'invisible' : ''}`}
              disabled={exercise.sets.length <= 1}
              aria-label={`Remove set ${index + 1}`}
            >
              <TrashIcon />
            </button>
          </React.Fragment>
        ))}
      </div>
      <button
        onClick={addSet}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-brand-primary hover:text-brand-light hover:bg-brand-primary/10 font-semibold transition-colors"
      >
        <PlusIcon />
        <span>Add Set</span>
      </button>
    </div>
  );
};

export default ExerciseLogger;
