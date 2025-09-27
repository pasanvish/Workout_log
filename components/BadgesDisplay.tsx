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
      <div className="text-center mb-6">
          <h4 className="text-xl font-bold text-text-primary">Achievements</h4>
          <p className="text-text-secondary">You've unlocked {earnedBadgesCount} of {BADGES.length} badges.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {BADGES.map(badge => {
          const isEarned = badge.isEarned(logs);
          return (
            <div key={badge.id} className={`p-4 rounded-lg flex flex-col items-center text-center transition-all duration-300 transform ${isEarned ? 'bg-card-dark border-2 border-brand-primary/50 scale-100' : 'bg-background-dark/50 opacity-60 scale-95'}`}>
              <div className={`w-16 h-16 mb-3 flex items-center justify-center rounded-full ${isEarned ? 'bg-brand-primary/20' : 'bg-gray-700'}`}>
                <badge.icon className={`w-10 h-10 ${isEarned ? 'text-brand-light' : 'text-gray-500'}`} />
              </div>
              <h5 className="font-bold text-sm text-text-primary">{badge.name}</h5>
              <p className="text-xs text-text-secondary mt-1">{badge.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesDisplay;
