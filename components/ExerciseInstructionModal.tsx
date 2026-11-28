import React, { useState } from 'react';
import ExercisePositionViewer from './ExercisePositionViewer';
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

function ExerciseGuide({ name, onClose }: { name: string; onClose: () => void }) {
  const [videoError, setVideoError] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const details = getExerciseDetails(name);
  const demo = getExerciseDemo(name);
  const instructions = Object.hasOwn(EXERCISE_INSTRUCTIONS, name) ? EXERCISE_INSTRUCTIONS[name] : undefined;
  const quickSteps = Object.hasOwn(EXERCISE_QUICK_STEPS, name) ? EXERCISE_QUICK_STEPS[name] : details.catalogue?.steps ?? [];
  const sections = instructions ? instructionSections(instructions) : quickSteps.length ? [{ title: 'How to do it', steps: quickSteps }] : [];

  return (
    <ModalFrame title={name} onClose={onClose} wide footer={
      <button type="button" onClick={onClose} className="panel-action">Done</button>
    }>
      <div className="space-y-4">
        <ExercisePositionViewer name={name} />
        {demo && <section className="guide-summary">
          <button type="button" className="panel-action" aria-expanded={showVideo} onClick={() => { setVideoError(false); setShowVideo(open => !open); }}>
            {showVideo ? 'Hide demo video' : 'Watch demo video'}
          </button>
          {showVideo && <div className="mt-3">
            {videoError ? <p role="status" className="text-sm text-text-secondary">
              The video couldn’t load. <a href={demo.page} target="_blank" rel="noopener noreferrer" className="underline">Watch the source clip</a>.
            </p> : <video controls playsInline loop muted preload="metadata"
              aria-label={`${name} demonstration`}
              className="mx-auto block aspect-video max-h-[42dvh] w-full rounded-xl bg-black object-contain"
              src={`${import.meta.env.BASE_URL}exercise-demos/${demo.file}.mp4`} onError={() => setVideoError(true)} />}
            <p className="mt-2 text-xs text-text-secondary">
              <a href={demo.page} target="_blank" rel="noopener noreferrer" className="underline">{demo.author}</a>
              {' · '}<a href={demo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{demo.license}</a>
              {' · '}Edited for the app
            </p>
          </div>}
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
