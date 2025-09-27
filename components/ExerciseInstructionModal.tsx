import React, { useState, useEffect, useMemo } from 'react';
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
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (isOpen && exerciseName) {
      const instruction = EXERCISE_INSTRUCTIONS[exerciseName];
      if (instruction) {
        setInstructions(instruction);
      } else {
        setInstructions("Sorry, pre-loaded instructions for this exercise are not available yet.");
      }
    }
  }, [isOpen, exerciseName]);
  
  const formattedHtml = useMemo(() => {
    return { __html: formatInstructions(instructions) };
  }, [instructions]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-background-light w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-border-color flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-text-primary">{exerciseName}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-card-dark hover:text-text-primary transition-colors" aria-label="Close instructions">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
          {instructions && (
            <div className="prose prose-invert text-text-secondary" dangerouslySetInnerHTML={formattedHtml}></div>
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
