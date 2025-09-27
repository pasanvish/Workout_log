import React from 'react';

interface PRNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prs: Array<{ exerciseName: string; weight: string; reps: string }>;
}

const MedalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM5 15h10v3H5v-3z" />
      <path d="M10 5a1 1 0 011 1v1.586l.707.707a1 1 0 01-1.414 1.414L10 9.414l-.293.293a1 1 0 01-1.414-1.414L9 8.586V6a1 1 0 011-1z" />
    </svg>
);


const PRNotificationModal: React.FC<PRNotificationModalProps> = ({ isOpen, onClose, prs }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-background-light w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 text-center border-b border-border-color bg-gray-900/50">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-text-primary">New Personal Records!</h2>
          <p className="text-text-secondary mt-1">Congratulations! You've smashed {prs.length} previous best{prs.length > 1 ? 's' : ''}.</p>
        </header>

        <main className="p-6 max-h-60 overflow-y-auto">
          <ul className="space-y-3">
            {prs.map((pr, index) => (
              <li key={index} className="flex items-center gap-4 bg-card-dark p-3 rounded-lg border border-border-color/50">
                <MedalIcon />
                <div className="flex-grow">
                  <p className="font-bold text-text-primary">{pr.exerciseName}</p>
                  <p className="text-sm text-text-secondary">
                    <span className="font-mono text-brand-light font-semibold">{pr.weight} kg</span> for <span className="font-mono text-brand-light font-semibold">{pr.reps} reps</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </main>
        
        <footer className="p-4 bg-background-dark/50">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-brand-primary to-cyan-500 hover:from-brand-secondary hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
          >
            Awesome!
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PRNotificationModal;