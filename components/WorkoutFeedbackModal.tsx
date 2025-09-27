import React, { useState } from 'react';

interface WorkoutFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (effort: number) => void;
}

const EFFORT_LEVELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😌', label: 'Very Easy' },
  2: { emoji: '😊', label: 'Easy' },
  3: { emoji: '🙂', label: 'Moderate' },
  4: { emoji: '🥵', label: 'Hard' },
  5: { emoji: '🤮', label: 'Max Effort' },
};

const WorkoutFeedbackModal: React.FC<WorkoutFeedbackModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [selectedEffort, setSelectedEffort] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedEffort) {
      onConfirm(selectedEffort);
      setSelectedEffort(null);
    }
  };

  const handleClose = () => {
    setSelectedEffort(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-background-light w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 text-center border-b border-border-color">
          <h2 className="text-2xl font-bold text-text-primary">Workout Complete!</h2>
          <p className="text-text-secondary mt-1">How did you feel during this session?</p>
        </header>

        <main className="p-8">
          <div className="flex justify-around items-center">
            {Object.entries(EFFORT_LEVELS).map(([level, { emoji, label }]) => (
              <button
                key={level}
                onClick={() => setSelectedEffort(Number(level))}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 transform hover:scale-110 w-20
                  ${selectedEffort === Number(level) ? 'bg-brand-primary/20' : 'hover:bg-card-dark'}`}
                title={label}
              >
                <span className={`text-5xl transition-transform duration-200 ${selectedEffort === Number(level) ? 'scale-110' : 'scale-100'}`}>{emoji}</span>
                <span className={`text-xs font-semibold ${selectedEffort === Number(level) ? 'text-brand-light' : 'text-text-secondary'}`}>{label}</span>
              </button>
            ))}
          </div>
        </main>
        
        <footer className="p-4 bg-background-dark/50">
          <button
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-brand-primary to-cyan-500 hover:from-brand-secondary hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-brand-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedEffort}
          >
            Save & Finish
          </button>
        </footer>
      </div>
    </div>
  );
};

export default WorkoutFeedbackModal;
