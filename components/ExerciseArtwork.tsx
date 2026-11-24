import React, { useState } from 'react';
import { getExerciseDetails } from '../exerciseDetails';

interface ExerciseArtworkProps {
  name: string;
  className?: string;
  frame?: string;
  alt?: string;
}

export default function ExerciseArtwork({ name, className = '', frame, alt = '' }: ExerciseArtworkProps) {
  const { reference } = getExerciseDetails(name);
  const [failedUrl, setFailedUrl] = useState<string>();
  const selectedFrame = frame ?? reference?.frames[reference.frames.length - 1];
  const url = reference && selectedFrame
    ? `${import.meta.env.BASE_URL}exercises/${reference.id}-${selectedFrame}.webp`
    : undefined;

  if (!url || failedUrl === url) {
    return (
      <span className={`exercise-art exercise-art-placeholder ${className}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-2/5">
          <path strokeLinecap="round" d="M8 12h8M5 7v10m3-8v6m8-6v6m3-8v10M3 10v4m18-4v4" />
        </svg>
      </span>
    );
  }

  return (
    <img
      className={`exercise-art ${className}`}
      src={url}
      alt={alt}
      width={512}
      height={512}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(url)}
    />
  );
}
