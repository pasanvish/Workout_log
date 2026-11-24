import React from 'react';
import { cleanSetInput, type SetField } from '../setTracking';
import type { Set, TrackingMode } from '../types';

export const setFields = (mode: TrackingMode): { key: SetField; label: string; description: string }[] => {
  if (mode === 'duration') return [{ key: 'seconds', label: 'Seconds', description: 'duration in seconds' }];
  const load = mode === 'bodyweight'
    ? { key: 'weight' as const, label: 'Added kg', description: 'added weight in kg (optional)' }
    : { key: 'weight' as const, label: 'kg', description: 'weight in kg' };
  return [load, { key: 'reps', label: 'Reps', description: 'reps' }];
};

interface SetInputsProps {
  exerciseName: string;
  index: number;
  set: Set;
  mode: TrackingMode;
  previous?: Set;
  showLabels?: boolean;
  onChange: (field: SetField, value: string) => void;
}

export default function SetInputs({ exerciseName, index, set, mode, previous, showLabels, onChange }: SetInputsProps) {
  return (
    <div className={`grid min-w-0 gap-2 ${mode === 'duration' ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {setFields(mode).map(({ key, label, description }) => (
        <div key={key} className="min-w-0">
          {showLabels && <p className="mb-1 text-center text-xs text-text-secondary">{label}</p>}
          <input type="text" inputMode={key === 'weight' ? 'decimal' : 'numeric'}
            value={set[key] ?? ''} placeholder={previous?.[key] || '—'}
            onChange={event => onChange(key, cleanSetInput(key, event.target.value))}
            className="track-input min-w-0 w-full text-center font-semibold tabular-nums"
            aria-label={`${exerciseName} set ${index + 1} ${description}`} />
        </div>
      ))}
    </div>
  );
}
