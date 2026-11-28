import React, { useEffect, useRef, useState } from 'react';
import { BLENDER_MESH_SOURCE, exerciseMotionUrl, exerciseVisualUrl, getExerciseMotion, getExerciseVisual, ILLUSTRATION_SOURCE, type ExerciseFrame } from '../exerciseVisuals';
import ExerciseArtwork from './ExerciseArtwork';

const labels: Record<ExerciseFrame, string> = {
  start: 'Start',
  mid: 'Middle',
  end: 'Finish',
  hold: 'Hold',
  pose: 'Reference pose',
};

export default function ExercisePositionViewer({ name }: { name: string }) {
  const visual = getExerciseVisual(name);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [animation, setAnimation] = useState<'closed' | 'open' | 'error'>('closed');
  const video = useRef<HTMLVideoElement>(null);
  const count = visual?.frames.length ?? 0;
  const last = count - 1;
  const active = step <= last ? step : 2 * last - step;

  useEffect(() => {
    if (!playing || count < 2) return;
    const timer = window.setInterval(() => setStep(index => (index + 1) % (2 * last)), 1200);
    return () => window.clearInterval(timer);
  }, [playing, count, last]);

  useEffect(() => {
    if (!playing && animation !== 'open') return;
    const pauseWhenHidden = () => {
      if (document.hidden) {
        setPlaying(false);
        video.current?.pause();
      }
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [playing, animation]);

  if (!visual) return null;
  const frame = visual.frames[active] ?? visual.frames[0];
  const motion = getExerciseMotion(visual.id);
  const hold = visual.frames.includes('hold');
  const stillHold = visual.id === 'plank' || visual.id === 'side-plank';
  const animationLabel = hold ? '3D hold setup' : motion === 'blender' ? '3D exercise animation' : 'Illustrated animation';
  const showAnimation = motion && animation === 'open';

  return (
    <section className="guide-summary space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{showAnimation ? animationLabel : 'Illustrated positions'}</h3>
        {!showAnimation && <span className="text-xs text-text-secondary">{labels[frame]}{count > 1 && ` · ${active + 1} of ${count}`}</span>}
      </div>
      <div className="grid min-h-32 place-items-center overflow-hidden rounded-lg bg-[#0c0e12]">
        {showAnimation ? <video ref={video} controls autoPlay muted playsInline loop
          aria-label={`${name}, ${animationLabel}`}
          className="exercise-art guide-art"
          width={visual.width} height={visual.height}
          poster={exerciseVisualUrl(visual.id, visual.frames[0])}
          src={exerciseMotionUrl(visual.id, motion)} onError={() => setAnimation('error')} /> : visual.frames.map((position, index) => (
          <ExerciseArtwork key={position} name={name} frame={position}
            alt={index === active ? `${name}, ${labels[position].toLowerCase()}` : ''}
            className={`guide-art [grid-area:1/1] transition-opacity duration-300 ${index === active ? 'opacity-100' : 'opacity-0'}`} />
        ))}
      </div>
      {!showAnimation && count > 1 && <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Illustrated exercise positions" className="flex flex-wrap gap-1.5">
          {visual.frames.map((position, index) => (
            <button type="button" className="category-chip" key={position} aria-pressed={active === index} onClick={() => {
              setPlaying(false);
              setStep(index);
            }}>{labels[position]}</button>
          ))}
        </div>
        <button type="button" className="panel-action" onClick={() => setPlaying(value => !value)}>{playing ? 'Pause views' : 'Cycle poses'}</button>
      </div>}
      {animation === 'error' && <p role="status" className="text-sm text-text-secondary">The animation couldn’t load. The reference artwork is available above.</p>}
      {motion && !stillHold && <button type="button" className={`panel-action ${motion === 'blender' && !showAnimation ? 'panel-action-primary' : ''}`} onClick={() => {
        setPlaying(false);
        setAnimation(showAnimation ? 'closed' : 'open');
      }}>{showAnimation ? 'Show reference' : hold ? 'Play hold setup' : motion === 'blender' ? 'Play 3D animation' : 'Play animation'}</button>}
      <p className="text-xs text-text-secondary">{motion === 'blender' ?
        <a href={BLENDER_MESH_SOURCE} target="_blank" rel="noopener noreferrer" className="underline">Mannequin base mesh · Blender Studio · CC0</a> : visual.original ? 'Gym Logger illustration' :
        <a href={ILLUSTRATION_SOURCE} target="_blank" rel="noopener noreferrer" className="underline">Open Exercise Illustrations · CC0</a>}
      </p>
    </section>
  );
}
