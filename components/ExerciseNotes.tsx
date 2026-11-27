import React from 'react';
import { MAX_EXERCISE_NOTES } from '../setTracking';

export default function ExerciseNotes({ name, notes, onChange }: { name: string; notes?: string; onChange: (notes: string) => void }) {
  return (
    <label className="block text-xs font-semibold text-text-secondary">
      Exercise notes
      <textarea aria-label={`Exercise notes for ${name}`} rows={2} maxLength={MAX_EXERCISE_NOTES}
        className="track-input mt-1 w-full resize-y" placeholder="Form cues, equipment setup, or how it felt"
        value={notes ?? ''} onChange={event => onChange(event.target.value)} />
    </label>
  );
}
