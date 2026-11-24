import React, { useState } from 'react';
import ModalFrame from './ModalFrame';

interface WorkoutFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (effort: number) => void;
  routineName?: string;
  setCount: number;
}

export const EFFORT_LEVELS = [
  { level: 1, label: 'Very easy', description: 'Plenty left in the tank' },
  { level: 2, label: 'Easy', description: 'Comfortable pace' },
  { level: 3, label: 'Moderate', description: 'Steady effort' },
  { level: 4, label: 'Hard', description: 'A challenging session' },
  { level: 5, label: 'Max effort', description: 'Near your limit' },
] as const;

function WorkoutFeedback({ onClose, onConfirm, routineName, setCount }: Omit<WorkoutFeedbackModalProps, 'isOpen'>) {
  const [selected, setSelected] = useState<number>();
  return (
    <ModalFrame title="Finish workout" onClose={onClose}
      description={routineName ? `${routineName} · ${setCount} ${setCount === 1 ? 'set' : 'sets'} logged` : undefined}
      footer={
        <>
          <button type="button" className="panel-action" onClick={onClose}>Keep logging</button>
          <button type="button" className="panel-action panel-action-primary disabled:opacity-40" disabled={selected === undefined}
            onClick={() => { if (selected !== undefined) onConfirm(selected); }}>Save workout</button>
        </>
      }>
      <h3 className="mb-3 text-sm font-semibold">How hard was this session?</h3>
      <div className="grid gap-2" role="group" aria-label="Session effort">
        {EFFORT_LEVELS.map(({ level, label, description }) => (
          <button type="button" key={level} className="effort-card" onClick={() => setSelected(level)} aria-pressed={selected === level}>
            <span className="session-date !size-9 text-sm font-bold">{level}</span>
            <span>
              <strong className="block text-sm">{label}</strong>
              <span className="block text-xs text-text-secondary">{description}</span>
            </span>
            <span className="effort-card-meter" aria-hidden="true">
              {EFFORT_LEVELS.map(segment => <span key={segment.level} data-filled={segment.level <= level} />)}
            </span>
          </button>
        ))}
      </div>
    </ModalFrame>
  );
}

export default function WorkoutFeedbackModal({ isOpen, ...props }: WorkoutFeedbackModalProps) {
  return isOpen ? <WorkoutFeedback {...props} /> : null;
}
