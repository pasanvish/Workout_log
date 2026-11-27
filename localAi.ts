import { Capacitor, registerPlugin } from '@capacitor/core';
import { completedSetCount, localLogDate, weekStart } from './training.ts';
import type { WorkoutLog } from './types';

type ModelState = 'available' | 'downloading' | 'pausing' | 'paused' | 'verifying' | 'ready' | 'generating' | 'unsupported';

interface ModelStatus {
  state: ModelState;
  bytes: number;
  total: number;
  message?: string;
}

export const hasNativeAi = Capacitor.getPlatform() === 'android';
export const localAi = registerPlugin<{
  status(): Promise<ModelStatus>;
  download(): Promise<void>;
  pause(): Promise<void>;
  remove(): Promise<void>;
  summarize(options: { facts: string }): Promise<{ summary: string }>;
}>('LocalAi');

export function weeklySummaryFacts(logs: WorkoutLog[], goal: number, now = new Date()) {
  const thisWeekStart = weekStart(now);
  const prior = new Date(thisWeekStart);
  prior.setDate(prior.getDate() - 7);
  const thisWeek = { workouts: 0, sets: 0 };
  const lastWeek = { workouts: 0, sets: 0 };
  for (const log of logs) {
    const date = weekStart(localLogDate(log.date));
    const week = date === thisWeekStart ? thisWeek : date === prior.getTime() ? lastWeek : undefined;
    if (week) {
      week.workouts++;
      week.sets += completedSetCount(log);
    }
  }
  return {
    key: `${thisWeekStart}:${goal}:${thisWeek.workouts}:${thisWeek.sets}:${lastWeek.workouts}:${lastWeek.sets}`,
    thisWeek,
    lastWeek,
    facts: `This week: ${thisWeek.workouts} workouts and ${thisWeek.sets} logged sets. `
      + `Last week: ${lastWeek.workouts} workouts and ${lastWeek.sets} logged sets. Weekly workout goal: ${goal}.`,
  };
}
