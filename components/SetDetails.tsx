import React from 'react';
import { isRpe, isSetType, RPE_VALUES, SET_TYPES } from '../setTracking';
import type { Set } from '../types';

interface SetDetailsProps {
  set: Set;
  label: string;
  onChange: (changes: Pick<Set, 'setType' | 'rpe'>) => void;
}

export default function SetDetails({ set, label, onChange }: SetDetailsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="min-w-0 text-xs text-text-secondary">
        Set type
        <select className="track-input mt-1 w-full" value={set.setType ?? 'working'} aria-label={`${label} type`}
          onChange={event => {
            const type = event.target.value;
            if (isSetType(type)) onChange({ setType: type === 'working' ? undefined : type });
          }}>
          {Object.entries(SET_TYPES).map(([value, name]) => <option value={value} key={value}>{name}</option>)}
        </select>
      </label>
      <label className="min-w-0 text-xs text-text-secondary">
        RPE
        <select className="track-input mt-1 w-full" value={set.rpe ?? ''} aria-label={`${label} RPE`}
          onChange={event => {
            const value = Number(event.target.value);
            onChange({ rpe: isRpe(value) ? value : undefined });
          }}>
          <option value="">Optional</option>
          {RPE_VALUES.map(value => <option value={value} key={value}>{value}</option>)}
        </select>
      </label>
    </div>
  );
}
