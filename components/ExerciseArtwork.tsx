import React, { useState } from 'react';
import { exerciseVisualUrl, getExerciseVisual, type ExerciseFrame } from '../exerciseVisuals';

interface ExerciseArtworkProps {
  name: string;
  className?: string;
  frame?: ExerciseFrame;
  alt?: string;
}

export default function ExerciseArtwork({ name, className = '', frame, alt = '' }: ExerciseArtworkProps) {
  const visual = getExerciseVisual(name);
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = visual && exerciseVisualUrl(visual.id, frame ?? 'thumb');

  if (!url || failedUrl === url) {
    return (
      <span className={`exercise-art exercise-art-placeholder ${className}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-2/5">
          <path strokeLinecap="round" d="M8 12h8M5 7v10m3-8v6m3-8v10M3 10v4m18-4v4" />
        </svg>
      </span>
    );
  }

  return (
    <img
      className={`exercise-art ${className}`}
      src={url}
      alt={alt}
      width={frame ? visual.width : 176}
      height={frame ? visual.height : 176}
      loading={frame ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedUrl(url)}
    />
  );
}
