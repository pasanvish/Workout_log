import { weeklySummaryFacts } from './localAi.ts';
import { progressionFor } from './progression.ts';
import { isCompleteSet, trackingOf } from './setTracking.ts';
import { localDayKey, localLogDate, weekStart } from './training.ts';
import { weeklyMuscleSets } from './trainingVolume.ts';
import { weekdayFor, type WeeklyPlan } from './weeklyPlan.ts';
import type { CustomExercise, CustomRoutine, WorkoutLog } from './types';

interface CoachFocus {
  id: 'schedule' | 'progress' | 'balance';
  title: string;
  detail: string;
}

export function weeklyCoach(
  logs: WorkoutLog[],
  customs: CustomExercise[],
  goal: number,
  plan: WeeklyPlan,
  routines: CustomRoutine[],
  now = new Date(),
) {
  const weekly = weeklySummaryFacts(logs, goal, now);
  const week = weekStart(now);
  const prior = new Date(week);
  prior.setDate(prior.getDate() - 7);
  const remaining = Math.max(0, goal - weekly.thisWeek.workouts);
  const weekSessions: WorkoutLog[] = [];
  const priorSessions: WorkoutLog[] = [];
  for (const log of logs) {
    const day = localLogDate(log.date).getTime();
    if (day >= prior.getTime() && day < week) priorSessions.push(log);
    else if (day >= week && weekStart(new Date(day)) === week) weekSessions.push(log);
  }
  const focus: CoachFocus[] = [];
  const today = localDayKey(now);
  const days = 7 - (now.getDay() + 6) % 7;
  const upcoming = Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() + index);
    const routine = routines.find(item => item.id === plan[weekdayFor(date)]);
    return { date, routine };
  }).find(({ date, routine }) => routine && !weekSessions.some(log =>
    localDayKey(localLogDate(log.date)) === localDayKey(date) && log.routineName === routine.name));
  if (upcoming?.routine) {
    const day = localDayKey(upcoming.date) === today ? 'Today' : upcoming.date.toLocaleDateString(undefined, { weekday: 'long' });
    focus.push({
      id: 'schedule',
      title: 'Follow your weekly plan',
      detail: `${day} · ${upcoming.routine.name}. Open your plan in Workout to start it.`,
    });
  } else if (remaining) {
    focus.push({
      id: 'schedule',
      title: 'Plan your next workout',
      detail: `${remaining} ${remaining === 1 ? 'workout' : 'workouts'} to reach your weekly goal. Assign a saved routine in Workout → Weekly plan.`,
    });
  }

  const lastByName = new Map<string, NonNullable<ReturnType<typeof progressionFor>>>();
  for (const log of weekSessions) for (const exercise of log.exercises) {
    if (lastByName.has(exercise.name) || !exercise.sets.some(set => isCompleteSet(set, trackingOf(exercise)))) continue;
    const hint = progressionFor(exercise);
    if (hint) lastByName.set(exercise.name, hint);
  }
  const top = [...lastByName].sort(([, a], [, b]) => Number(Boolean(b.readyForLoad)) - Number(Boolean(a.readyForLoad)))[0];
  if (top) {
    const [name, hint] = top;
    focus.push({
      id: 'progress', title: name, detail: `${hint.title}. ${hint.reason}`,
    });
  }

  const currentGroups = weeklyMuscleSets(weekSessions, customs, week);
  const currentNames = new Set(currentGroups.map(([name]) => name));
  const earlier = weeklyMuscleSets(priorSessions, customs, prior.getTime()).find(([name]) => !currentNames.has(name));
  if (currentGroups.length && earlier) {
    const [group, sets] = earlier;
    focus.push({
      id: 'balance', title: `Check your ${group.toLowerCase()} training`,
      detail: `You logged ${sets} working ${sets === 1 ? 'set' : 'sets'} targeting ${group.toLowerCase()} last week. See your muscle chart before picking your next session.`,
    });
  } else if (currentGroups.length) {
    const [group, sets] = currentGroups[0];
    focus.push({
      id: 'balance', title: 'Review your muscle distribution',
      detail: `${group} led your week with ${sets} working ${sets === 1 ? 'set' : 'sets'}. Open Muscles to compare your training across groups.`,
    });
  }

  const preferred = remaining && focus.some(item => item.id === 'schedule') ? 'schedule'
    : top?.[1].readyForLoad ? 'progress'
    : earlier && currentGroups.length ? 'balance' : focus[0]?.id;
  focus.sort((a, b) => Number(b.id === preferred) - Number(a.id === preferred));
  return { weekly, focus };
}
