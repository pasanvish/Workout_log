import React, { useEffect, useState } from 'react';
import { Exercise, Set, TrackingMode } from '../types';
import { emptySet, formatDuration, formatSetDetails, TRACKING_LABELS, trackingOf, isTrackingMode } from '../setTracking';
import SetInputs, { setFields } from './SetInputs';
import SetDetails from './SetDetails';
import ExerciseNotes from './ExerciseNotes';
import PlateCalculator from './PlateCalculator';

interface ExerciseLoggerProps {
  exercise: Exercise;
  previous?: Exercise;
  onChange: (exercise: Exercise) => void;
  onRest: () => void;
}

export default function ExerciseLogger({ exercise, previous, onChange, onRest }: ExerciseLoggerProps) {
  const [stopwatch, setStopwatch] = useState<{ setId: string; start: number }>();
  const [tick, setTick] = useState(Date.now);
  const [plateCalculator, setPlateCalculator] = useState<string>();
  const [showSetDetails, setShowSetDetails] = useState(false);
  const mode = trackingOf(exercise);
  const elapsed = stopwatch ? Math.max(0, Math.floor((tick - stopwatch.start) / 1000)) : 0;

  useEffect(() => {
    if (!stopwatch) return;
    const timer = window.setInterval(() => setTick(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [stopwatch]);

  const updateSets = (sets: Set[]) => onChange({ ...exercise, sets });
  const updateSet = (id: string, changes: Partial<Set>) =>
    updateSets(exercise.sets.map(set => set.id === id ? { ...set, ...changes } : set));

  function changeMode(next: TrackingMode) {
    if (next === mode) return;
    if ((stopwatch || exercise.sets.some(set => set.weight || set.reps || set.seconds)) &&
      !window.confirm('Switch logging type? This clears the sets entered for this exercise.')) return;
    setStopwatch(undefined);
    onChange({ ...exercise, tracking: next, sets: exercise.sets.map(set => ({ ...emptySet(), setType: set.setType })) });
  }

  function toggleStopwatch(set: Set) {
    if (stopwatch?.setId === set.id) {
      const seconds = Math.floor((Date.now() - stopwatch.start) / 1000);
      if (seconds < 1) return;
      updateSets(exercise.sets.map(item => item.id === set.id ? { ...item, seconds: String(seconds) } : item));
      setStopwatch(undefined);
    } else {
      const now = Date.now();
      setTick(now);
      setStopwatch({ setId: set.id, start: now });
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-text-secondary">
        Logging type
        <select className="track-input" value={mode} onChange={event => {
          const value = event.target.value;
          if (isTrackingMode(value)) changeMode(value);
        }} aria-label={`Logging type for ${exercise.name}`}>
          {Object.entries(TRACKING_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        {mode === 'weight' && <button type="button" className="category-chip" onClick={() => setPlateCalculator(
          exercise.sets.filter(set => set.weight).at(-1)?.weight ?? (previous && trackingOf(previous) === 'weight' ? previous.sets.filter(set => set.weight).at(-1)?.weight : undefined) ?? ''
        )}>Plate calculator</button>}
        <button type="button" className="category-chip" aria-expanded={showSetDetails} onClick={() => setShowSetDetails(visible => !visible)}>
          {showSetDetails ? 'Hide set details' : 'Set details'}
        </button>
      </div>
      {showSetDetails && <p className="text-xs text-text-secondary">RPE is rate of perceived exertion. 10 means maximum effort.</p>}
      {mode === 'bodyweight' && <p className="text-xs text-text-secondary">Enter reps. Leave added kg blank for bodyweight only.</p>}
      <div className="grid grid-cols-[2rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-center text-xs font-semibold text-text-secondary">
        <span>Set</span>
        <div className={`grid gap-2 ${mode === 'duration' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {setFields(mode).map(field => <span key={field.key}>{field.label}</span>)}
        </div>
        <span />
      </div>
      {exercise.sets.map((set, index) => {
        const running = stopwatch?.setId === set.id;
        const details = formatSetDetails(set);
        return (
          <div key={set.id} className="space-y-1.5">
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_2.5rem] items-center gap-2">
              <span className="text-center text-sm font-semibold tabular-nums text-text-secondary">{index + 1}</span>
              <SetInputs exerciseName={exercise.name} index={index} set={set} mode={mode}
                previous={previous && trackingOf(previous) === mode ? previous.sets[index] : undefined}
                onChange={(field, value) => updateSet(set.id, { [field]: value })} />
              <button type="button" disabled={exercise.sets.length <= 1} className="set-remove" aria-label={`Remove ${exercise.name} set ${index + 1}`}
                onClick={() => {
                  if (running) setStopwatch(undefined);
                  updateSets(exercise.sets.filter(item => item.id !== set.id));
                }}>
                <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M6 18 18 6" strokeLinecap="round" /></svg>
              </button>
            </div>
            {showSetDetails ? (
              <div className="ml-10 mr-12">
                <SetDetails set={set} label={`${exercise.name} set ${index + 1}`} onChange={changes => updateSet(set.id, changes)} />
              </div>
            ) : details && <p className="ml-10 text-xs text-text-secondary">{details}</p>}
            {mode === 'duration' && (
              <div className="ml-10 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => toggleStopwatch(set)} disabled={Boolean(stopwatch && !running) || (running && elapsed === 0)}
                  className="category-chip disabled:opacity-50" aria-label={`${running ? 'Log' : 'Time'} ${exercise.name} set ${index + 1}`}>
                  {running ? `Log ${formatDuration(elapsed)}` : 'Start stopwatch'}
                </button>
                {running && <button type="button" onClick={() => setStopwatch(undefined)} className="category-chip">Cancel stopwatch</button>}
              </div>
            )}
          </div>
        );
      })}
      <details className="rounded-lg border border-border-color/60 px-3 py-2.5">
        <summary className="cursor-pointer text-xs font-semibold">Exercise notes</summary>
        <div className="mt-2 space-y-2">
          <ExerciseNotes name={exercise.name} notes={exercise.notes} onChange={notes => onChange({ ...exercise, notes })} />
          {previous?.notes?.trim() && <p className="whitespace-pre-wrap break-words text-xs text-text-secondary">Last time · {previous.notes}</p>}
        </div>
      </details>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => updateSets([...exercise.sets, emptySet()])} className="panel-action flex-1">+ Add set</button>
        <button type="button" onClick={onRest} className="panel-action">Rest timer</button>
      </div>
      {plateCalculator !== undefined && <PlateCalculator initialWeight={plateCalculator} onClose={() => setPlateCalculator(undefined)} />}
    </div>
  );
}
