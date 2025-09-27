import React, { useState, useEffect } from 'react';
import { MASTER_EXERCISE_LIST } from '../constants';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, category: string) => void;
  initialValue?: string;
}

const CreateExerciseModal: React.FC<CreateExerciseModalProps> = ({ isOpen, onClose, onSave, initialValue }) => {
  const [exerciseName, setExerciseName] = useState('');
  const [category, setCategory] = useState(Object.keys(MASTER_EXERCISE_LIST)[0]);

  useEffect(() => {
    if (initialValue) {
        setExerciseName(initialValue);
    }
  }, [initialValue]);

  const handleSave = () => {
    if (exerciseName.trim() && category) {
      onSave(exerciseName.trim(), category);
      setExerciseName('');
    } else {
      alert('Please provide an exercise name and select a category.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-background-light w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-border-color">
          <h2 className="text-lg font-bold text-text-primary">Create New Exercise</h2>
        </header>

        <main className="p-6 space-y-4">
          <div>
            <label htmlFor="exerciseName" className="block text-sm font-medium text-text-secondary mb-1">Exercise Name</label>
            <input
              id="exerciseName"
              type="text"
              value={exerciseName}
              onChange={e => setExerciseName(e.target.value)}
              placeholder="e.g., Plate Pinch"
              className="w-full bg-background-dark border-2 border-border-color rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary transition-colors"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">Category</label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-background-dark border-2 border-border-color rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary transition-colors"
            >
              {Object.keys(MASTER_EXERCISE_LIST).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </main>
        
        <footer className="p-4 border-t border-border-color flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-card-dark hover:bg-gray-600 text-text-primary transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white transition-colors disabled:opacity-50"
            disabled={!exerciseName.trim() || !category}
          >
            Save Exercise
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CreateExerciseModal;
