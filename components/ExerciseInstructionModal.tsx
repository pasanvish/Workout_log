import React, { useState } from 'react';
import ExerciseArtwork from './ExerciseArtwork';
import ExerciseMuscles from './ExerciseMuscles';
import ModalFrame from './ModalFrame';
import { ExerciseTargetMap } from './BodyMuscleMap';
import { CATALOGUE_SOURCE } from '../exerciseCatalogue';
import { getExerciseDetails } from '../exerciseDetails';
import { getExerciseDemo } from '../exerciseDemos';
import { EXERCISE_INSTRUCTIONS, EXERCISE_QUICK_STEPS } from '../instructions';

interface ExerciseInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string | null;
}

function instructionSections(text: string) {
  const sections: { title: string; steps: string[] }[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('### ')) sections.push({ title: line.slice(4), steps: [] });
    if (line.startsWith('* ') || line.startsWith('- ')) sections.at(-1)?.steps.push(line.slice(2));
  }
  return sections;
}

function Positions({ name }: { name: string }) {
  const { reference } = getExerciseDetails(name);
  if (!reference?.frames.length) return null;
  const multiple = reference.frames.length > 1;
  return <>
    <div className={`grid gap-2 ${multiple ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {reference.frames.map((frame, index) => (
        <figure key={frame}>
          <ExerciseArtwork name={name} frame={frame}
            alt={`${name}, ${multiple ? `position ${index + 1}` : 'exercise position'}`} className="guide-art" />
          {multiple && <figcaption className="mt-1 text-center text-xs text-text-secondary">Position {index + 1}</figcaption>}
        </figure>
      ))}
    </div>
    <p className="mt-2 text-xs text-text-secondary">
      {reference.source === 'repdb'
        ? <a href="https://repdb.co" target="_blank" rel="noopener noreferrer" className="underline">Exercise data by RepDB (repdb.co)</a>
        : <>Artwork by <a href="https://bryllim.github.io/workout-guide/" target="_blank" rel="noopener noreferrer" className="underline">Bryl Lim and Everkinetic</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY-SA 4.0</a></>}
    </p>
  </>;
}

function ExerciseGuide({ name, onClose }: { name: string; onClose: () => void }) {
  const [videoError, setVideoError] = useState(false);
  const details = getExerciseDetails(name);
  const demo = getExerciseDemo(name);
  const instructions = Object.hasOwn(EXERCISE_INSTRUCTIONS, name) ? EXERCISE_INSTRUCTIONS[name] : undefined;
  const quickSteps = Object.hasOwn(EXERCISE_QUICK_STEPS, name) ? EXERCISE_QUICK_STEPS[name] : details.catalogue?.steps ?? [];
  const hasPositions = Boolean(details.reference?.frames.length);
  const sections = instructions ? instructionSections(instructions) : quickSteps.length ? [{ title: 'How to do it', steps: quickSteps }] : [];

  return (
    <ModalFrame title={name} onClose={onClose} wide footer={
      <button type="button" onClick={onClose} className="panel-action">Done</button>
    }>
      <div className="space-y-4">
        {(demo || hasPositions) && <section className="guide-summary">
          {demo && !videoError ? <>
            <h3 className="mb-2 font-semibold">Watch the movement</h3>
            <video controls playsInline loop muted preload="metadata"
              aria-label={`${name} demonstration`}
              className="mx-auto block aspect-video max-h-[42dvh] w-full rounded-xl bg-black object-contain"
              src={`${import.meta.env.BASE_URL}exercise-demos/${demo.file}.mp4`} onError={() => setVideoError(true)} />
            <p className="mt-2 text-xs text-text-secondary">
              <a href={demo.page} target="_blank" rel="noopener noreferrer" className="underline">{demo.author}</a>
              {' · '}<a href={demo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{demo.license}</a>
              {' · '}Edited for the app
            </p>
            <details className="mt-3 rounded-lg border border-border-color/60 p-2.5">
              <summary className="cursor-pointer text-xs font-semibold">Illustrated positions</summary>
              <div className="mt-2"><Positions name={name} /></div>
            </details>
          </> : <>
            <h3 className="mb-2 font-semibold">Illustrated positions</h3>
            {videoError && <p role="status" className="mb-2 text-xs text-text-secondary">
              The video couldn’t load. <a href={demo.page} target="_blank" rel="noopener noreferrer" className="underline">Watch the source clip</a>.
            </p>}
            <Positions name={name} />
          </>}
        </section>}
        <section className="tracking-panel">
          <h3 className="font-semibold">Target muscles</h3>
          {details.description && <p className="my-2 text-sm leading-relaxed text-text-secondary">{details.description}</p>}
          {details.equipment && <p className="my-2 text-xs font-medium text-text-secondary">{details.equipment}</p>}
          {details.reference ? <>
            <div className="mb-3"><ExerciseMuscles name={name} /></div>
            <ExerciseTargetMap primary={details.reference.primaryMuscles} secondary={details.reference.secondaryMuscles} />
          </> : <p className="text-sm text-text-secondary">Custom exercises use their selected category in the muscle charts.</p>}
        </section>
        {sections.map(({ title, steps }) => (
          <section key={title} className="tracking-panel">
            <h3 className="text-sm font-bold text-brand-light">{title}</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-text-secondary">
              {steps.map(step => <li key={step}>{step}</li>)}
            </ul>
            {details.catalogue && <p className="mt-3 text-xs text-text-secondary">
              <a className="underline" href={CATALOGUE_SOURCE} target="_blank" rel="noopener noreferrer">Exercise data from Free Exercise DB</a>
            </p>}
          </section>
        ))}
      </div>
    </ModalFrame>
  );
}

export default function ExerciseInstructionModal({ isOpen, onClose, exerciseName }: ExerciseInstructionModalProps) {
  return isOpen && exerciseName ? <ExerciseGuide key={exerciseName} name={exerciseName} onClose={onClose} /> : null;
}
