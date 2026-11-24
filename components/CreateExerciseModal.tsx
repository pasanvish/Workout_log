import React, { useState } from 'react';
import { MASTER_EXERCISE_LIST } from '../constants';
import { CustomExercise } from '../types';
import ModalFrame from './ModalFrame';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, category: string) => void;
  initialValue?: string;
  customExercises: CustomExercise[];
}

function CreateExerciseForm({ onClose, onSave, initialValue = '', customExercises }: Omit<CreateExerciseModalProps, 'isOpen'>) {
  const [exerciseName, setExerciseName] = useState(initialValue);
  const categories = Object.keys(MASTER_EXERCISE_LIST);
  const [category, setCategory] = useState(categories[0]);
  const trimmed = exerciseName.trim();
  const duplicate = trimmed && [
    ...Object.values(MASTER_EXERCISE_LIST).flat(),
    ...customExercises.map(exercise => exercise.name),
  ].some(name => name.toLowerCase() === trimmed.toLowerCase());

  return (
    <ModalFrame title="Custom exercise" onClose={onClose} footer={
      <>
        <button type="button" onClick={onClose} className="panel-action">Cancel</button>
        <button type="submit" form="custom-exercise-form" className="panel-action panel-action-primary disabled:opacity-40"
          disabled={!trimmed || Boolean(duplicate)}>Save exercise</button>
      </>
    }>
      <form id="custom-exercise-form" className="space-y-4" onSubmit={event => {
        event.preventDefault();
        if (trimmed && !duplicate) onSave(trimmed, category);
      }}>
        <label className="block text-xs font-semibold text-text-secondary">
          Exercise name
          <input className="track-input mt-1.5 w-full" value={exerciseName} onChange={event => setExerciseName(event.target.value)}
            placeholder="e.g., Plate pinch" aria-invalid={Boolean(duplicate)} aria-describedby={duplicate ? 'custom-exercise-error' : undefined} />
        </label>
        {duplicate && <p id="custom-exercise-error" className="text-sm text-red-300">An exercise with this name already exists.</p>}
        <label className="block text-xs font-semibold text-text-secondary">
          Category
          <select className="track-input mt-1.5 w-full" value={category} onChange={event => setCategory(event.target.value)}>
            {categories.map(label => <option key={label} value={label}>{label}</option>)}
          </select>
        </label>
      </form>
    </ModalFrame>
  );
}

export default function CreateExerciseModal({ isOpen, ...props }: CreateExerciseModalProps) {
  return isOpen ? <CreateExerciseForm {...props} /> : null;
}
