import React, { useMemo, useState } from 'react';
import { parseHistoryCsv } from '../historyImport';
import type { CustomExercise, WorkoutLog } from '../types';
import ModalFrame from './ModalFrame';

interface Props {
  csv: string;
  logs: WorkoutLog[];
  customExercises: CustomExercise[];
  onClose: () => void;
  onImport: (data: unknown) => void;
}

export default function HistoryImportModal({ csv, logs, customExercises, onClose, onImport }: Props) {
  const [unit, setUnit] = useState<'kg' | 'lb'>();
  const [dateOrder, setDateOrder] = useState<'dmy' | 'mdy'>();
  const result = useMemo(() => {
    try {
      return { parsed: parseHistoryCsv(csv, unit ?? 'kg', customExercises, dateOrder) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'This CSV could not be read.' };
    }
  }, [csv, unit, customExercises, dateOrder]);

  const parsed = result.parsed;
  const existing = new Set(logs.map(log => log.id));
  const fresh = parsed?.workoutLogs.filter(log => !existing.has(log.id)) ?? [];
  const duplicateCount = (parsed?.workoutLogs.length ?? 0) - fresh.length;
  const importedSets = fresh.reduce((total, log) => total + log.exercises.reduce((count, exercise) => count + exercise.sets.length, 0), 0);
  const neededNames = new Set(fresh.flatMap(log => log.exercises.map(exercise => exercise.name)));
  const exercises = parsed?.customExercises.filter(exercise => neededNames.has(exercise.name)) ?? [];
  const canImport = Boolean(fresh.length && (!parsed?.needsWeightUnit || unit) && (!parsed?.needsDateOrder || dateOrder));

  return <ModalFrame title="Review CSV import" onClose={onClose} footer={canImport && <button type="button"
    className="panel-action panel-action-primary" onClick={() => onImport({ workoutLogs: fresh, customExercises: exercises })}>
    Import {fresh.length} {fresh.length === 1 ? 'workout' : 'workouts'}
  </button>}>
    {parsed ? <div className="space-y-3">
      <h3 className="text-lg font-semibold">{parsed.source} workout history</h3>
      <p className="text-sm text-text-secondary">{fresh.length} new {fresh.length === 1 ? 'workout' : 'workouts'} · {importedSets} sets · {exercises.length} new custom exercises</p>
      {parsed.source === 'FitNotes' && <p className="text-sm text-text-secondary">FitNotes entries are grouped by date.</p>}
      {parsed.needsWeightUnit && <label className="block text-sm text-text-secondary">
        Weight unit for entries without one
        <select className="track-input mt-1 w-full" value={unit ?? ''} onChange={event => {
          const value = event.target.value;
          setUnit(value === 'kg' || value === 'lb' ? value : undefined);
        }}>
          <option value="">Choose kilograms or pounds</option>
          <option value="kg">Kilograms (kg)</option>
          <option value="lb">Pounds (lb)</option>
        </select>
      </label>}
      {parsed.needsDateOrder && <label className="block text-sm text-text-secondary">
        Date format in your export
        <select className="track-input mt-1 w-full" value={dateOrder ?? ''} onChange={event => {
          const value = event.target.value;
          setDateOrder(value === 'dmy' || value === 'mdy' ? value : undefined);
        }}>
          <option value="">Choose the order of day and month</option>
          <option value="dmy">Day / Month / Year</option>
          <option value="mdy">Month / Day / Year</option>
        </select>
      </label>}
      {parsed.timedDistanceRows > 0 && <p className="text-sm text-text-secondary">Cardio entries with time are imported as timed sets. Distance is omitted.</p>}
      {duplicateCount > 0 && <p className="text-sm text-text-secondary">
        {duplicateCount} {duplicateCount === 1 ? 'workout is' : 'workouts are'} already in your history.
      </p>}
      {parsed.skippedRows > 0 && <p className="text-sm text-text-secondary">
        {parsed.skippedRows} {parsed.skippedRows === 1 ? 'row could' : 'rows could'} not be imported. Check for missing dates or set values, distance-only entries, or assisted loads.
      </p>}
      {!parsed.workoutLogs.length && <p role="status" className="text-sm text-text-secondary">No supported workout sets were found.</p>}
    </div> : <p role="alert" className="text-sm text-text-secondary">{result.error}</p>}
  </ModalFrame>;
}
