import React, { useState } from 'react';
import { DEFAULT_REP_RANGE, progressionFor, REP_RANGES } from '../progression';
import { trackingOf } from '../setTracking';
import type { Exercise } from '../types';

export default function ProgressionHint({ previous }: { previous: Exercise }) {
  const [range, setRange] = useState(2);
  const suggestion = progressionFor(previous, REP_RANGES[range] ?? DEFAULT_REP_RANGE);
  if (!suggestion) return null;
  return <details className="mb-4 rounded-lg border border-border-color/70 bg-background-dark p-3">
    <summary className="cursor-pointer text-sm font-semibold text-brand-light">Next-set suggestion</summary>
    {trackingOf(previous) !== 'duration' && <label className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
      Target reps per set
      <select className="track-input" value={range} onChange={event => setRange(Number(event.target.value))}>
        {REP_RANGES.map(([low, high], index) => <option key={low} value={index}>{low}–{high} reps</option>)}
      </select>
    </label>}
    <p className="mt-2 text-sm font-semibold">{suggestion.title}</p>
    <p className="mt-1 text-xs text-text-secondary">{suggestion.reason}</p>
  </details>;
}
