import React, { useEffect, useState } from 'react';
import { exerciseVisualUrl, getExerciseVisual, ILLUSTRATION_SOURCE, type ExerciseFrame } from '../exerciseVisuals';
import ExerciseArtwork from './ExerciseArtwork';

const labels: Record<ExerciseFrame, string> = {
  start: 'Start',
  mid: 'Middle',
  end: 'Finish',
  hold: 'Hold',
};

export default function ExercisePositionViewer({ name }: { name: string }) {
  const visual = getExerciseVisual(name);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const count = visual?.frames.length ?? 0;

  useEffect(() => {
    if (!playing || count < 2) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % count), 1200);
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, [playing, count]);

  if (!visual) return null;
  const frame = visual.frames[active] ?? visual.frames[0];

  function play() {
    if (!visual) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    for (const position of visual.frames) {
      const image = new Image();
      image.src = exerciseVisualUrl(visual.id, position);
    }
    setPlaying(true);
  }

  return (
    <section className="guide-summary space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Illustrated positions</h3>
        <span className="text-xs text-text-secondary">{labels[frame]}{count > 1 && ` · ${active + 1} of ${count}`}</span>
      </div>
      <div className="grid min-h-32 place-items-center overflow-hidden rounded-lg bg-[#0c0e12]">
        <ExerciseArtwork name={name} frame={frame} alt={`${name}, ${labels[frame].toLowerCase()} position`} className="guide-art" />
      </div>
      {count > 1 && <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Illustrated exercise positions" className="flex flex-wrap gap-1.5">
          {visual.frames.map((position, index) => (
            <button type="button" className="category-chip" key={position} aria-pressed={active === index} onClick={() => {
              setPlaying(false);
              setActive(index);
            }}>{labels[position]}</button>
          ))}
        </div>
        <button type="button" className="panel-action" onClick={play}>{playing ? 'Pause views' : 'Play views'}</button>
      </div>}
      <p className="text-xs text-text-secondary">{visual.original ? 'Gym Logger illustration' :
        <a href={ILLUSTRATION_SOURCE} target="_blank" rel="noopener noreferrer" className="underline">Open Exercise Illustrations · CC0</a>}
      </p>
    </section>
  );
}
