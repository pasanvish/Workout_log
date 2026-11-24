import React from 'react';
import BadgeEmblem from './BadgeEmblem';
import ExerciseArtwork from './ExerciseArtwork';
import ModalFrame from './ModalFrame';
import type { Badge } from '../types';

interface PRNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: Badge[];
  prs: Array<{ exerciseName: string; label: string; value: string }>;
}

export default function PRNotificationModal({ isOpen, onClose, prs, badges }: PRNotificationModalProps) {
  if (!isOpen) return null;

  return (
    <ModalFrame
      title={badges.length ? 'Achievement unlocked' : prs.length === 1 ? 'New personal record' : 'New personal records'}
      description={prs.length ? `You set ${prs.length} ${prs.length === 1 ? 'personal record' : 'personal records'} in this workout.` : undefined}
      onClose={onClose}
      footer={<button type="button" onClick={onClose} className="panel-action panel-action-primary">View history</button>}
    >
      <ul className="grid gap-2.5">
        {badges.map(badge => (
          <li key={badge.id} className="flex items-center gap-3 rounded-2xl border border-brand-primary/40 bg-brand-primary/10 p-3">
            <BadgeEmblem badge={badge} />
            <div><p className="text-sm font-semibold">{badge.name}</p><p className="mt-1 text-xs text-text-secondary">{badge.description}</p></div>
          </li>
        ))}
        {prs.map(({ exerciseName, label, value }, index) => (
          <li key={index} className="flex items-center gap-3 rounded-2xl border border-yellow-300/30 bg-yellow-300/5 p-3">
            <ExerciseArtwork name={exerciseName} className="!w-12 shrink-0 !rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold">{exerciseName}</p>
              <p className="mt-1 text-sm tabular-nums text-yellow-200">{value} · {label}</p>
            </div>
            <span className="rounded-full border border-yellow-300/30 px-2 py-1 text-xs font-bold text-yellow-200">PR</span>
          </li>
        ))}
      </ul>
    </ModalFrame>
  );
}
