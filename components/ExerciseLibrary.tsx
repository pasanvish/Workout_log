import React, { useMemo, useState } from 'react';
import { MASTER_EXERCISE_LIST } from '../constants';
import { getExerciseDetails } from '../exerciseDetails';
import { CustomExercise } from '../types';
import ExerciseArtwork from './ExerciseArtwork';
import ExerciseMuscles from './ExerciseMuscles';

interface ExerciseLibraryProps {
  search: string;
  onSearch: (value: string) => void;
  onCreate: () => void;
  customExercises: CustomExercise[];
  selected: ReadonlySet<string>;
  excluded?: ReadonlySet<string>;
  onToggle: (name: string) => void;
}

export default function ExerciseLibrary({ search, onSearch, onCreate, customExercises, selected, excluded, onToggle }: ExerciseLibraryProps) {
  const [category, setCategory] = useState<string | null>(null);
  const categories = useMemo(() => {
    const list = new Map(Object.entries(MASTER_EXERCISE_LIST).map(([label, names]) => [label, new Set(names)]));
    const builtIn = new Set(Object.values(MASTER_EXERCISE_LIST).flat());
    for (const exercise of customExercises) {
      if (builtIn.has(exercise.name)) continue;
      const names = list.get(exercise.category) ?? new Set<string>();
      names.add(exercise.name);
      list.set(exercise.category, names);
    }
    return [...list];
  }, [customExercises]);

  const query = search.trim().toLowerCase();
  const matches = categories.flatMap(([label, names]) => {
    if (category && category !== label) return [];
    const available = [...names].filter(name => {
      if (excluded?.has(name)) return false;
      const { reference } = getExerciseDetails(name);
      const fields = [name, label, ...(reference?.primaryMuscles ?? []), ...(reference?.secondaryMuscles ?? [])];
      return !query || fields.some(field => field.toLowerCase().includes(query));
    });
    return available.length ? [{ label, available }] : [];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">
          Search exercises
          <input type="search" value={search} onChange={event => onSearch(event.target.value)}
            placeholder="Exercise or muscle" className="track-input mt-1.5 w-full" />
        </label>
        <button type="button" className="panel-action shrink-0" onClick={onCreate}>Add custom</button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto px-1 pb-2 pt-1" role="group" aria-label="Filter exercises by category">
        <button type="button" className="category-chip" aria-pressed={category === null} onClick={() => setCategory(null)}>All</button>
        {categories.map(([label]) => (
          <button type="button" key={label} className="category-chip" aria-pressed={category === label} onClick={() => setCategory(label)}>{label}</button>
        ))}
      </div>
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border-color/60 bg-background-dark p-2.5" aria-label="Selected exercises">
          {[...selected].map(name => (
            <button type="button" key={name} className="category-chip selection-chip" aria-label={`Remove ${name} from selection`} onClick={() => onToggle(name)}>
              {name} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      {matches.map(({ label, available }) => (
        <section key={label}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {available.map(name => (
              <button type="button" key={name} className={`picker-card ${selected.has(name) ? 'is-selected' : ''}`}
                aria-pressed={selected.has(name)} onClick={() => onToggle(name)}>
                <ExerciseArtwork name={name} className="picker-art" />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold">{name}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-text-secondary">{getExerciseDetails(name).description}</span>
                  <ExerciseMuscles name={name} compact />
                </span>
                <span aria-hidden="true" className="picker-indicator">{selected.has(name) ? '✓' : '+'}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {matches.length === 0 && (
        <p className="rounded-xl bg-background-dark p-4 text-sm text-text-secondary">No exercises match these filters.</p>
      )}
    </div>
  );
}
