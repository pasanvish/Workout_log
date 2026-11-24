import React from 'react';
import ExerciseArtwork from './ExerciseArtwork';
import ExerciseMuscles from './ExerciseMuscles';
import { getExerciseDetails } from '../exerciseDetails';
import { EXERCISE_INSTRUCTIONS } from '../instructions';

interface ExerciseInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string | null;
}

const formatInstructions = (text: string) => {
    return text
        .split('\n')
        .map(line => {
            line = line.trim();
            if (line.startsWith('### ')) return `<h3 class="text-lg font-semibold text-brand-light mt-4 mb-2">${line.substring(4)}</h3>`;
            if (line.startsWith('## ')) return `<h2 class="text-xl font-bold text-text-primary mt-5 mb-3">${line.substring(3)}</h2>`;
            if (line.startsWith('* ') || line.startsWith('- ')) return `<li class="mb-1 ml-4" style="list-style-type: disc;">${line.substring(2)}</li>`;
            if (line === '') return '<br />';
            return `<p>${line}</p>`;
        })
        .join('')
        // Post-process to wrap consecutive li elements in a ul
        .replace(/<\/li><li/g, '</li><li')
        .replace(/<li class="mb-1 ml-4" style="list-style-type: disc;">/g, '<ul><li class="mb-1 ml-4" style="list-style-type: disc;">')
        .replace(/<\/li>(?!<li)/g, '</li></ul>');
};

const ExerciseInstructionModal: React.FC<ExerciseInstructionModalProps> = ({ isOpen, onClose, exerciseName }) => {
  if (!isOpen || !exerciseName) return null;

  const details = getExerciseDetails(exerciseName);
  const frames = details.reference?.frames ?? [];
  const hasMultipleFrames = frames.length > 1;
  const instructions = Object.hasOwn(EXERCISE_INSTRUCTIONS, exerciseName)
    ? EXERCISE_INSTRUCTIONS[exerciseName]
    : undefined;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-guide-title"
    >
      <div
        className="bg-background-light w-full max-w-2xl max-h-[90dvh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-border-color flex justify-between items-center flex-shrink-0">
          <h2 id="exercise-guide-title" className="text-xl font-bold text-text-primary">{exerciseName}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-card-dark hover:text-text-primary transition-colors" aria-label="Close instructions">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <main className="p-4 sm:p-6 overflow-y-auto">
          <div className="guide-summary mb-5">
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
          {!instructions && <p className="text-sm text-text-secondary">A detailed step-by-step guide has not been added for this exercise yet.</p>}
          {instructions && (
            <div className="prose prose-invert text-text-secondary" dangerouslySetInnerHTML={{ __html: formatInstructions(instructions) }}></div>
          )}
        </main>
        
        <footer className="p-3 border-t border-border-color text-center text-xs text-text-secondary bg-background-dark/50 flex-shrink-0">
          <p>Disclaimer: Always prioritize safety and consult with a qualified fitness professional before starting any new exercise.</p>
        </footer>
      </div>
    </div>
  );
};

export default ExerciseInstructionModal;
