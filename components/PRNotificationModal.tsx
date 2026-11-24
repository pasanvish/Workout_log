import React from 'react';
import ExerciseArtwork from './ExerciseArtwork';
import ModalFrame from './ModalFrame';

interface PRNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prs: Array<{ exerciseName: string; weight: string; reps: string }>;
}

export default function PRNotificationModal({ isOpen, onClose, prs }: PRNotificationModalProps) {
  if (!isOpen) return null;

  return (
    <ModalFrame
      title={prs.length === 1 ? 'New personal record' : 'New personal records'}
      description={`You set ${prs.length} ${prs.length === 1 ? 'record' : 'records'} in this workout.`}
      onClose={onClose}
      footer={<button type="button" onClick={onClose} className="panel-action panel-action-primary">View history</button>}
    >
      <ul className="grid gap-2.5">
        {prs.map(({ exerciseName, weight, reps }, index) => (
          <li key={index} className="flex items-center gap-3 rounded-2xl border border-yellow-300/30 bg-yellow-300/5 p-3">
            <ExerciseArtwork name={exerciseName} className="!w-12 shrink-0 !rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold">{exerciseName}</p>
              <p className="mt-1 text-sm tabular-nums text-yellow-200">{weight} kg × {reps} {reps === '1' ? 'rep' : 'reps'}</p>
            </div>
            <span className="rounded-full border border-yellow-300/30 px-2 py-1 text-xs font-bold text-yellow-200">PR</span>
          </li>
        ))}
      </ul>
    </ModalFrame>
  );
}
