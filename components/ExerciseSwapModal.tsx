import React, { useState } from 'react';
import { exerciseSwaps } from '../exerciseSwaps';
import type { CustomExercise, Exercise } from '../types';
import ModalFrame from './ModalFrame';
import ExerciseArtwork from './ExerciseArtwork';

interface Props {
  exercise: Exercise;
  exercises: Exercise[];
  customExercises: CustomExercise[];
  onClose: () => void;
  onSwap: (name: string) => void;
}

export default function ExerciseSwapModal({ exercise, exercises, customExercises, onClose, onSwap }: Props) {
  const [equipment, setEquipment] = useState('');
  const [selected, setSelected] = useState('');
  const candidates = exerciseSwaps(exercise, exercises, customExercises);
  const equipmentOptions = [...new Set(candidates.flatMap(item => item.equipment ?? []))].sort();
  const visible = (equipment ? candidates.filter(item => item.equipment === equipment) : candidates).slice(0, 10);
  const hasEntries = Boolean(exercise.notes?.trim() || exercise.sets.some(set => set.weight || set.reps || set.seconds || set.rpe));
  return (
    <ModalFrame title={`Swap ${exercise.name}`} onClose={onClose} footer={
      <button type="button" className="panel-action panel-action-primary" disabled={!selected} onClick={() => onSwap(selected)}>
        Swap in this workout
      </button>
    }>
      <div className="space-y-3">
        {candidates.length ? <>
          {hasEntries && <p className="rounded-lg bg-background-dark p-3 text-sm text-text-secondary">
            Swapping will clear the set values and notes entered for this exercise in this workout.
          </p>}
          <label className="block text-xs font-semibold text-text-secondary">
            Equipment available
            <select className="track-input mt-1 w-full" value={equipment} onChange={event => {
              setEquipment(event.target.value);
              setSelected('');
            }}>
              <option value="">Any equipment</option>
              {equipmentOptions.map(name => <option key={name}>{name}</option>)}
            </select>
          </label>
          <div className="grid gap-2">
            {visible.map(item => <button type="button" key={item.name} aria-pressed={item.name === selected}
              className={`picker-card ${item.name === selected ? 'is-selected' : ''}`} onClick={() => setSelected(item.name)}>
              <ExerciseArtwork name={item.name} className="size-12 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">{item.name}</strong>
                <span className="block text-xs text-text-secondary">{[item.equipment, ...item.matches].filter(Boolean).join(' · ')}</span>
              </span>
              <span aria-hidden="true" className="picker-indicator">{item.name === selected ? '✓' : '+'}</span>
            </button>)}
          </div>
        </> : <p className="text-sm text-text-secondary">No similar exercise is available outside this workout.</p>}
      </div>
    </ModalFrame>
  );
}
