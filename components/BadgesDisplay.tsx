import React from 'react';
import { WorkoutLog } from '../types';
import { BADGES } from '../badges';

interface BadgesDisplayProps {
  logs: WorkoutLog[];
}

const BadgesDisplay: React.FC<BadgesDisplayProps> = ({ logs }) => {
  const earnedBadgesCount = BADGES.filter(badge => badge.isEarned(logs)).length;

  return (
    <div>
      <p className="mb-2 text-sm text-text-secondary">{earnedBadgesCount} of {BADGES.length} unlocked</p>
      <progress className="session-progress mb-4" aria-label="Achievements unlocked" value={earnedBadgesCount} max={BADGES.length} />
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {BADGES.map(badge => {
          const isEarned = badge.isEarned(logs);
          const progress = badge.progress?.(logs);
          return (
            <li key={badge.id} className={`min-w-0 rounded-xl border p-3 ${isEarned ? 'border-brand-primary/40 bg-brand-primary/10' : 'border-border-color/60 bg-background-dark'}`}>
              <div className={`mb-2 flex size-10 items-center justify-center rounded-lg ${isEarned ? 'bg-brand-primary/15 text-brand-light' : 'bg-card-dark text-text-secondary'}`}>
                <badge.icon className="size-6" aria-hidden="true" />
              </div>
              <h5 className="text-sm font-semibold">{badge.name}</h5>
              <span className={`text-[11px] font-semibold ${isEarned ? 'text-brand-light' : 'text-text-secondary'}`}>{isEarned ? 'Unlocked' : 'Locked'}</span>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{badge.description}</p>
              {!isEarned && progress && (
                <div className="mt-2">
                  <progress className="session-progress" aria-label={`${badge.name} progress`} value={progress.current} max={progress.target} />
                  <span className="mt-1 block text-xs tabular-nums text-text-secondary">{progress.current} / {progress.target}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BadgesDisplay;
