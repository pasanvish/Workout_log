import { Capacitor, registerPlugin } from '@capacitor/core';
import { completedSetCount, localLogDate, weekStart } from './training.ts';
import type { WorkoutLog } from './types';

type ModelState = 'available' | 'downloading' | 'pausing' | 'paused' | 'verifying' | 'ready' | 'generating' | 'unsupported';

export type ModelId = 'lite' | 'qwen';

interface ModelStatus {
  id: ModelId;
  name: string;
  state: ModelState;
  bytes: number;
  total: number;
  message?: string;
}

export const hasNativeAi = Capacitor.getPlatform() === 'android';
export const localAi = registerPlugin<{
  status(): Promise<{ models: ModelStatus[]; busy: boolean }>;
  download(options: { model: ModelId }): Promise<void>;
  pause(options: { model: ModelId }): Promise<void>;
  remove(options: { model: ModelId }): Promise<void>;
  summarize(options: { model: ModelId; facts: string }): Promise<{ summary: string }>;
}>('LocalAi');

const quantity = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

export function formatLiteRecap(modelText: string, workouts: number, sets: number) {
  const counts = `${quantity(workouts, 'workout')} and ${quantity(sets, 'set')}`;
  const past = '(?:logged|completed|recorded|did)';
  const valid = new RegExp(`^(?:This week,? you ${past} ${counts}|You ${past} ${counts} this week)[.!]?$`, 'i');
  const summary = modelText.trim().replace(/\s+/g, ' ')
    .replace(/^I /i, 'You ').replace(/^This week,? I /i, 'This week, you ');
  return valid.test(summary)
    ? { summary, generated: true }
    : { summary: `You logged ${counts} this week.`, generated: false };
}

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
    litePrompt: `Rewrite this as a short fitness recap. ${formatLiteRecap('', thisWeek.workouts, thisWeek.sets).summary}`,
    facts: `This week: ${thisWeek.workouts} workouts and ${thisWeek.sets} logged sets. `
      + `Last week: ${lastWeek.workouts} workouts and ${lastWeek.sets} logged sets. Weekly workout goal: ${goal}.`,
  };
}
