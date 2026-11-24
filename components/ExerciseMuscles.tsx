import React from 'react';
import { getExerciseDetails } from '../exerciseDetails';

export default function ExerciseMuscles({ name, compact = false }: { name: string; compact?: boolean }) {
  const { reference } = getExerciseDetails(name);
  if (!reference) return null;

  if (compact) {
    return (
      <span className="block text-xs text-brand-light mt-2">
        Targets {reference.primaryMuscles.join(' · ')}
      </span>
    );
  }

  return (
    <dl className="space-y-1.5 text-xs leading-relaxed">
      <div>
        <dt className="inline font-semibold text-brand-light">Primary muscles</dt>{' '}
        <dd className="inline text-text-primary">{reference.primaryMuscles.join(' · ')}</dd>
      </div>
      {reference.secondaryMuscles.length > 0 && (
        <div>
          <dt className="inline font-semibold text-text-secondary">Secondary muscles</dt>{' '}
          <dd className="inline text-text-secondary">{reference.secondaryMuscles.join(' · ')}</dd>
        </div>
      )}
    </dl>
  );
}
