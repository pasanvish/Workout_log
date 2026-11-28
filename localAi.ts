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
  compact?: boolean;
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

const quantity = (value: number, noun: string) => `${value} ${noun}${value === 1 ? '' : 's'}`;

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
    facts: `This week: ${quantity(thisWeek.workouts, 'workout')} and ${thisWeek.sets} logged ${thisWeek.sets === 1 ? 'set' : 'sets'}. `
      + `Last week: ${quantity(lastWeek.workouts, 'workout')} and ${lastWeek.sets} logged ${lastWeek.sets === 1 ? 'set' : 'sets'}. Weekly workout goal: ${goal}.`,
  };
}

export function workoutRecap(model: ModelId, text: string, weekly: ReturnType<typeof weeklySummaryFacts>) {
  const counts = (week: typeof weekly.thisWeek) => `${quantity(week.workouts, 'workout')} and ${quantity(week.sets, 'set')}`;
  const current = counts(weekly.thisWeek);
  const prior = counts(weekly.lastWeek);
  const fallback = model === 'lite' ? `You logged ${current} this week.` : `This week: ${current}. Last week: ${prior}.`;
  const description = text.trim().replace(/\s+/g, ' ')
    .replace(/^I /i, 'You ').replace(/^This week,? I /i, 'This week, you ');
  const withLogged = (value: string) => value.replace(/ (sets?)$/, ' (?:logged )?$1');
  const shape = model === 'lite'
    ? `^(?:This week,? you (?:logged|completed|recorded|did) ${withLogged(current)}|You (?:logged|completed|recorded|did) ${withLogged(current)} this week)[.!]?$`
    : `^This week: ${withLogged(current)}[.!] Last week: ${withLogged(prior)}[.!]`;
  const verified = new RegExp(shape, 'i').exec(description)?.[0];
  return { summary: verified ?? fallback, generated: Boolean(verified) };
}
