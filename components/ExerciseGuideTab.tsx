import React, { useState } from 'react';
import type { CustomExercise } from '../types';
import CreateExerciseModal from './CreateExerciseModal';
import ExerciseInstructionModal from './ExerciseInstructionModal';
import ExerciseLibrary from './ExerciseLibrary';

interface ExerciseGuideTabProps {
  customExercises: CustomExercise[];
  onAddCustomExercise: (exercise: Omit<CustomExercise, 'id'>) => CustomExercise;
}

export default function ExerciseGuideTab({ customExercises, onAddCustomExercise }: ExerciseGuideTabProps) {
  const [search, setSearch] = useState('');
  const [guide, setGuide] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="workout-hero">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Exercises</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">Search by exercise, muscle, or equipment. Open a guide to see the movement, form cues, and muscles it works.</p>
        </div>
      </header>
      <section className="tracking-panel" aria-label="Search the exercise library">
        <ExerciseLibrary search={search} onSearch={setSearch} onCreate={() => setCreating(true)}
          customExercises={customExercises} onOpen={setGuide} />
      </section>
      <ExerciseInstructionModal isOpen={Boolean(guide)} exerciseName={guide} onClose={() => setGuide(null)} />
      <CreateExerciseModal isOpen={creating} initialValue={search} customExercises={customExercises} onClose={() => setCreating(false)}
        onSave={(name, category, tracking) => {
          onAddCustomExercise({ name, category, tracking });
          setSearch(name);
          setCreating(false);
        }} />
    </div>
  );
}
