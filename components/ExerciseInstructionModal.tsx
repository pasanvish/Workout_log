import React from 'react';
import ExerciseArtwork from './ExerciseArtwork';
import ExerciseMuscles from './ExerciseMuscles';
import ModalFrame from './ModalFrame';
import { getExerciseDetails } from '../exerciseDetails';
import { EXERCISE_INSTRUCTIONS } from '../instructions';

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

const ExerciseInstructionModal: React.FC<ExerciseInstructionModalProps> = ({ isOpen, onClose, exerciseName }) => {
  if (!isOpen || !exerciseName) return null;

  const details = getExerciseDetails(exerciseName);
  const frames = details.reference?.frames ?? [];
  const hasMultipleFrames = frames.length > 1;
  const instructions = Object.hasOwn(EXERCISE_INSTRUCTIONS, exerciseName)
    ? EXERCISE_INSTRUCTIONS[exerciseName]
    : undefined;

  const sections = instructions ? instructionSections(instructions) : [];

  return (
    <ModalFrame title={exerciseName} onClose={onClose} wide footer={
      <button type="button" onClick={onClose} className="panel-action">Done</button>
    }>
      <div className="guide-summary mb-4">
        {details.reference && (
          <>
            <div className={`grid gap-2 mb-2 ${hasMultipleFrames ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {frames.map((frame, index) => (
                <figure key={frame}>
                  <ExerciseArtwork
                    name={exerciseName}
                    frame={frame}
                    alt={`${exerciseName}, ${hasMultipleFrames ? `position ${index + 1}` : 'exercise position'}`}
                    className="guide-art"
                  />
                  {hasMultipleFrames && (
                    <figcaption className="mt-1 text-center text-xs text-text-secondary">Position {index + 1}</figcaption>
                  )}
                </figure>
              ))}
            </div>
            <p className="mb-4 text-xs text-text-secondary">
              {details.reference.source === 'repdb'
                ? <a href="https://repdb.co" target="_blank" rel="noopener noreferrer" className="underline">Exercise data by RepDB (repdb.co)</a>
                : <>Artwork by <a href="https://bryllim.github.io/workout-guide/" target="_blank" rel="noopener noreferrer" className="underline">Bryl Lim and Everkinetic</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY-SA 4.0</a></>}
            </p>
          </>
        )}
        <p className="text-text-primary leading-relaxed mb-3">{details.description}</p>
        <ExerciseMuscles name={exerciseName} />
        {!details.reference && <p className="text-sm text-text-secondary">Muscle targets haven’t been added for this custom exercise.</p>}
      </div>
      {sections.length > 0 ? (
        <div className="space-y-3">
          {sections.map(({ title, steps }) => (
            <section key={title} className="tracking-panel">
              <h3 className="text-sm font-bold text-brand-light">{title}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-text-secondary">
                {steps.map(step => <li key={step}>{step}</li>)}
              </ul>
            </section>
          ))}
        </div>
      ) : <p className="text-sm text-text-secondary">A detailed guide is unavailable for this exercise.</p>}
    </ModalFrame>
  );
};

export default ExerciseInstructionModal;
