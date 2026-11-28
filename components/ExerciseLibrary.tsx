import React, { useMemo, useState } from 'react';
import { MASTER_EXERCISE_LIST } from '../constants';
import { getExerciseDetails } from '../exerciseDetails';
import { getExerciseDemo } from '../exerciseDemos';
import { getExerciseMotion, getExerciseVisual } from '../exerciseVisuals';
import { exerciseEquipment } from '../exerciseCatalogue';
import { muscleGroupFor } from '../muscleGroups';
import { CustomExercise } from '../types';
import ExerciseArtwork from './ExerciseArtwork';
import ExerciseMuscles from './ExerciseMuscles';

const PAGE_SIZE = 36;
const equipmentOptions = [...new Set(Object.values(MASTER_EXERCISE_LIST).flat()
  .flatMap(name => exerciseEquipment(name) ?? []))].sort();

interface ExerciseLibraryProps {
  search: string;
  onSearch: (value: string) => void;
  onCreate: () => void;
  customExercises: CustomExercise[];
}

type ExerciseLibraryMode =
  | { selected: ReadonlySet<string>; excluded?: ReadonlySet<string>; onToggle: (name: string) => void; onOpen?: never }
  | { onOpen: (name: string) => void; selected?: never; excluded?: never; onToggle?: never };

export default function ExerciseLibrary({ search, onSearch, onCreate, customExercises, selected, excluded, onToggle, onOpen }: ExerciseLibraryProps & ExerciseLibraryMode) {
  const [category, setCategory] = useState<string | null>(null);
  const [media, setMedia] = useState<'all' | 'pictures' | 'videos' | 'blender'>('all');
  const [equipment, setEquipment] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
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

  const words = search.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const matches = categories.flatMap(([label, names]) => {
    if (category && category !== label) return [];
    const available = [...names].filter(name => {
      if (excluded?.has(name)) return false;
      if (media === 'videos' && !getExerciseDemo(name)) return false;
      if (media === 'pictures' && !getExerciseVisual(name)) return false;
      if (media === 'blender') {
        const visual = getExerciseVisual(name);
        const motion = visual && getExerciseMotion(visual.id);
        if (motion !== 'blender') return false;
      }
      const details = getExerciseDetails(name);
      if (equipment && details.equipment !== equipment) return false;
      const { reference } = details;
      const muscles = [...(reference?.primaryMuscles ?? []), ...(reference?.secondaryMuscles ?? [])];
      const fields = [name, label, details.equipment, ...muscles, ...muscles.map(muscleGroupFor)].join(' ').toLowerCase();
      return words.every(word => fields.includes(word));
    });
    return available.length ? [{ label, available }] : [];
  });

  const total = matches.reduce((count, group) => count + group.available.length, 0);
  let remaining = limit;
  const visible = matches.flatMap(group => {
    const available = group.available.slice(0, Math.max(0, remaining));
    remaining -= available.length;
    return available.length ? [{ ...group, available }] : [];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">
          Search exercises
          <input type="search" value={search} onChange={event => { onSearch(event.target.value); setLimit(PAGE_SIZE); }}
            placeholder="Name, muscle or equipment" className="track-input mt-1.5 w-full" />
        </label>
        <button type="button" className="panel-action shrink-0" onClick={() => { setMedia('all'); setEquipment(''); setCategory(null); onCreate(); }}>Add custom</button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto px-1 pb-2 pt-1" role="group" aria-label="Filter exercises by category">
        <button type="button" className="category-chip" aria-pressed={category === null} onClick={() => { setCategory(null); setLimit(PAGE_SIZE); }}>All</button>
        {categories.map(([label]) => (
          <button type="button" key={label} className="category-chip" aria-pressed={category === label} onClick={() => { setCategory(label); setLimit(PAGE_SIZE); }}>{label}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select aria-label="Equipment" className="track-input min-w-0 max-w-full" value={equipment}
          onChange={event => { setEquipment(event.target.value); setLimit(PAGE_SIZE); }}>
          <option value="">All equipment</option>
          {equipmentOptions.map(label => <option key={label} value={label}>{label}</option>)}
        </select>
        {onOpen && <select aria-label="Guide media" className="track-input min-w-0 max-w-full" value={media}
          onChange={event => { setMedia(event.target.value as typeof media); setLimit(PAGE_SIZE); }}>
          <option value="all">All guides</option>
          <option value="pictures">With pictures</option>
          <option value="videos">With video</option>
          <option value="blender">With 3D animation</option>
        </select>}
      </div>
      {total > 0 && <p className="text-xs text-text-secondary" role="status">
        {total > limit ? `Showing ${limit} of ${total} exercises` : `${total} ${total === 1 ? 'exercise' : 'exercises'}`}
      </p>}
      {Boolean(selected?.size) && (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border-color/60 bg-background-dark p-2.5" aria-label="Selected exercises">
          {[...selected].map(name => (
            <button type="button" key={name} className="category-chip selection-chip" aria-label={`Remove ${name} from selection`} onClick={() => onToggle?.(name)}>
              {name} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      {visible.map(({ label, available }) => (
        <section key={label}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {available.map(name => {
              const picked = selected?.has(name);
              const details = getExerciseDetails(name);
              const hasVideo = Boolean(onOpen && getExerciseDemo(name));
              const visual = onOpen && getExerciseVisual(name);
              const motion = visual && getExerciseMotion(visual.id);
              return <button type="button" key={name} className={`picker-card ${picked ? 'is-selected' : ''}`}
                aria-pressed={picked} aria-label={onOpen ? `Open ${name} guide` : undefined} onClick={() => (onOpen ?? onToggle)?.(name)}>
                <ExerciseArtwork name={name} className="picker-art" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="break-words text-sm font-semibold">{name}</span>
                    {hasVideo && <span className="history-chip text-brand-light">Video</span>}
                    {motion && <span className="history-chip text-brand-light">{motion === 'blender' ? '3D animation' : 'Animation'}</span>}
                    {!hasVideo && !motion && visual && <span className="history-chip">{visual.frames.length > 1 ? 'Poses' : 'Picture'}</span>}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-text-secondary">{details.description || details.equipment}</span>
                  <ExerciseMuscles name={name} compact />
                </span>
                <span aria-hidden="true" className="picker-indicator">{onOpen ? '›' : picked ? '✓' : '+'}</span>
              </button>;
            })}
          </div>
        </section>
      ))}
      {total > limit && <button type="button" className="panel-action w-full" onClick={() => setLimit(count => count + PAGE_SIZE)}>
        Show more exercises
      </button>}
      {matches.length === 0 && (
        <p className="rounded-xl bg-background-dark p-4 text-sm text-text-secondary">No exercises match these filters.</p>
      )}
    </div>
  );
}
