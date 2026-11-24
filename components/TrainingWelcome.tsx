import React, { useMemo } from 'react';
import { BADGES } from '../badges';
import { DEFAULT_WEEKLY_GOAL } from '../profile';
import { localLogDate, weekStart } from '../training';
import type { Profile, WorkoutLog } from '../types';
import ProfileAvatar from './ProfileAvatar';

export default function TrainingWelcome({ profile, logs, onAchievements }: {
  profile: Profile; logs: WorkoutLog[]; onAchievements: () => void;
}) {
  const thisWeek = weekStart(new Date());
  const { workoutCount, earned, nextBadge, progress } = useMemo(() => {
    const unlocked = BADGES.filter(badge => badge.isEarned(logs));
    const next = BADGES.find(badge => badge.progress && !unlocked.includes(badge));
    return {
      workoutCount: logs.filter(log => weekStart(localLogDate(log.date)) === thisWeek).length,
      earned: unlocked.length,
      nextBadge: next,
      progress: next?.progress?.(logs),
    };
  }, [logs, thisWeek]);
  const goal = profile.weeklyGoal ?? DEFAULT_WEEKLY_GOAL;

  return (
    <div className="space-y-3">
      <div className="workout-hero !gap-3 !p-5 sm:!p-7">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-light">{logs.length ? 'Welcome back' : 'Welcome to Gym Logger'}</p>
          <h2 className="mt-1 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">{profile.name}</h2>
          <p className="mt-2 text-sm text-text-secondary">
            {workoutCount >= goal ? 'You reached your workout goal this week.' : 'Ready for your next workout?'}
          </p>
        </div>
        <ProfileAvatar profile={profile} className="size-16 !rounded-2xl text-2xl sm:size-20" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="tracking-panel">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Weekly goal</h3>
            <strong className="text-lg tabular-nums text-brand-light">{workoutCount} / {goal}</strong>
          </div>
          <progress className="session-progress mt-2.5" aria-label="Weekly workout goal" value={Math.min(workoutCount, goal)} max={goal} />
          <p className="mt-2 text-xs text-text-secondary">Workouts this week · Monday to Sunday</p>
        </section>
        <button type="button" onClick={onAchievements} className="tracking-panel space-y-2 text-left hover:border-brand-primary">
          <span className="flex justify-between gap-2 text-sm font-semibold">Achievements <span className="text-brand-light">{earned} / {BADGES.length} →</span></span>
          {nextBadge && progress ? (
            <span className="block text-xs text-text-secondary">Next: {nextBadge.name} · {progress.current} / {progress.target}</span>
          ) : <span className="block text-xs text-text-secondary">All progress milestones unlocked</span>}
        </button>
      </div>
    </div>
  );
}
