import React, { useState, useMemo } from 'react';
import { CustomExercise, Exercise, TrackingMode } from '../types';
import ExerciseLibrary from './ExerciseLibrary';
import ModalFrame from './ModalFrame';
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

  const handleCreateExerciseSave = (name: string, category: string, tracking: TrackingMode) => {
    const newExercise = onAddCustomExercise({ name, category, tracking });
    handleToggleExercise(newExercise.name);
    setCreateExerciseModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <ModalFrame title="Add exercises" onClose={handleClose} wide footer={
        <>
          <span className="mr-auto text-xs text-text-secondary" role="status">{selectedExercises.size} selected</span>
          <button type="button" onClick={handleClose} className="panel-action">Cancel</button>
          <button type="button" onClick={handleAdd} className="panel-action panel-action-primary disabled:opacity-40" disabled={selectedExercises.size === 0}>
            {selectedExercises.size === 1 ? 'Add exercise' : 'Add exercises'}
          </button>
        </>
      }>
        <ExerciseLibrary search={searchTerm} onSearch={setSearchTerm} onCreate={() => setCreateExerciseModalOpen(true)}
          customExercises={customExercises} selected={selectedExercises} excluded={currentExerciseNames} onToggle={handleToggleExercise} />
      </ModalFrame>
      <CreateExerciseModal isOpen={isCreateExerciseModalOpen} onClose={() => setCreateExerciseModalOpen(false)}
        onSave={handleCreateExerciseSave} initialValue={searchTerm} customExercises={customExercises} />
    </>
  );
};

export default ExercisePickerModal;
