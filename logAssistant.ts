import { formatRecord, formatSet, isCompleteSet, progressMetric, trackingOf } from './setTracking.ts';
import { weeklySummaryFacts } from './localAi.ts';
import { latestWorkingExercise, progressionFor } from './progression.ts';
import { weeklyMuscleSets } from './trainingVolume.ts';
import { weeklyCoach } from './weeklyCoach.ts';
import type { WeeklyPlan } from './weeklyPlan.ts';
import { completedSetCount, localLogDate, weekStart } from './training.ts';
import type { CustomExercise, CustomRoutine, ProfilePRs, WorkoutLog } from './types';

const examples = {
  week: [
    'How many workouts this week?', 'Show my weekly activity', 'How often did I train this week?',
    'How many sessions have I done this week?', 'Show my workout count for this week',
    'How many sets did I log this week?', 'Am I on track for my weekly goal?',
    'How is my weekly training going?', 'How close am I to my weekly goal?', 'What was my activity this week?', 'How many times did I work out this week?',
  ],
  latest: [
    'What did I do last workout?', 'Show my latest session', 'What was my most recent workout?',
    'When did I last train?', 'What did I log last time?', 'What was my last session?',
    'When was my latest workout?', 'When did I last do this exercise?', 'Show the last time I did this',
    'What did I lift last time?', 'What did I log the last time I did this exercise?', 'What did I do in my previous session?',
  ],
  records: [
    'Show my personal records', 'What are my recent PRs?', 'What is my best set?',
    'What are my latest personal bests?', 'Did I set any new records?',
    'Show recent personal records', 'Which personal bests did I hit?',
    'What are my top lifts?', 'What is my personal best?', 'Show my best lifts',
  ],
} satisfies Record<string, string[]>;

type Intent = keyof typeof examples;
const intents = Object.keys(examples) as Intent[];
const stopWords = new Set(['a', 'am', 'any', 'are', 'did', 'do', 'for', 'have', 'how', 'i', 'in', 'is', 'my', 'of', 'show', 'the', 'to', 'was', 'what', 'which']);
const aliases: Record<string, string> = {
  pr: 'record', prs: 'record', records: 'record', bests: 'best', workouts: 'workout', sessions: 'session',
  sets: 'set', lifts: 'lift', logged: 'log', training: 'train', worked: 'work', previous: 'last',
};
const normalize = (value: string) => value.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.join(' ') ?? '';
const tokens = (value: string) => [...new Set(normalize(value).split(' ').filter(word => word && !stopWords.has(word)).map(word => aliases[word] ?? word))];

// Fit one TF-IDF centroid per intent from the small, hand-written training set.
// The model classifies the question. The answer is computed from saved log entries.
const documents = intents.flatMap(intent => examples[intent].map(example => ({ intent, words: tokens(example) })));
const frequency = new Map<string, number>();
for (const { words } of documents) for (const word of words) frequency.set(word, (frequency.get(word) ?? 0) + 1);
const weight = (word: string) => Math.log1p(documents.length / (frequency.get(word) ?? 1));
const vectorLength = (vector: Map<string, number>) => Math.hypot(...vector.values());
const model = intents.map(intent => {
  const vector = new Map<string, number>();
  for (const { intent: label, words } of documents) {
    if (label !== intent) continue;
    for (const word of words) vector.set(word, (vector.get(word) ?? 0) + weight(word));
  }
  return { intent, vector, length: vectorLength(vector) };
});

export function classifyLogQuestion(question: string): Intent | undefined {
  const words = tokens(question);
  if (words.filter(word => frequency.has(word)).length < 2) return;
  const query = new Map(words.map(word => [word, weight(word)]));
  const length = vectorLength(query);
  const scores = model.map(({ intent, vector, length: centroidLength }) => ({
    intent,
    score: [...query].reduce((sum, [word, value]) => sum + value * (vector.get(word) ?? 0), 0) / (length * centroidLength),
  })).sort((a, b) => b.score - a.score);
  const [best, second] = scores;
  return best.score >= 0.23 && best.score - second.score >= 0.06 ? best.intent : undefined;
}

export const LOG_QUESTIONS = [
  'What should I train next?', 'Which muscles did I train this week?', 'How did I compare to last week?', 'What did I do last workout?',
];

const unsupportedPeriod = /\b(today|yesterday|tomorrow|last week|next week|last month|this month|this year|last year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/;
const unsupportedTopic = /\b(should|recommend|suggest|prescribe|calories|nutrition|meal|diet|split|how long)\b/;
const fallback = 'Ask about your next workout, muscles trained this week, your last sets, or personal records. For progression, try “Can I add weight to Bench Press?”';
const dateLabel = (value: string) => localLogDate(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

interface CoachData {
  customExercises: CustomExercise[];
  routines: CustomRoutine[];
  plan: WeeklyPlan;
}
const emptyCoachData: CoachData = { customExercises: [], routines: [], plan: {} };

export function answerLogQuestion(question: string, logs: WorkoutLog[], records: ProfilePRs, goal: number, now = new Date(), coach = emptyCoachData) {
  const normalized = ` ${normalize(question)} `;
  const exerciseNames = [...new Set(logs.flatMap(log => log.exercises.map(exercise => exercise.name)))];
  const names = exerciseNames.map(name => ({ name, key: ` ${normalize(name)} `, base: ` ${normalize(name.replace(/\s+\([^()]+\)$/, ''))} ` }));
  const mentioned = names.flatMap(item => {
    if (item.key.trim() && normalized.includes(item.key)) return [item];
    if (item.base !== item.key && normalized.includes(item.base) && names.filter(other => other.base === item.base).length === 1) {
      return [{ ...item, key: item.base }];
    }
    return [];
  }).sort((a, b) => b.key.length - a.key.length);
  const match = mentioned[0];
  const request = match ? normalized.replace(match.key, ' ') : normalized;
  const several = mentioned.some(({ key }) => !match?.key.includes(key));
  if (several || /\b(injury|injured|pain|rehab|medical|diagnose|calories|nutrition|diet)\b/.test(request)) return fallback;
  if (match && /\b(progress|progression|add (?:more )?(?:weight|load|reps|time)|increase (?:the )?(?:weight|load|reps|time))\b/.test(request)) {
    const previous = latestWorkingExercise(logs, match.name);
    const hint = previous && progressionFor(previous);
    return hint ? `${match.name}\n${hint.title}. ${hint.reason}` : `Log a working set for ${match.name} to see a progression suggestion.`;
  }
  if (!match && /\b(?:workouts?|train|training|session)\b.*\bnext\b|\bnext (?:workout|session)\b/.test(request)
    && !/\bnext (?:week|month|year)\b/.test(request)) {
    const insights = weeklyCoach(logs, coach.customExercises, goal, coach.plan, coach.routines, now);
    const item = insights.focus.find(item => item.id === 'schedule') ?? insights.focus[0];
    return item ? `${item.title}\n${item.detail}` : 'Open your weekly plan or log a session to get a focus for your next workout.';
  }
  if (!match && /\bmuscles?\b/.test(request) && /\b(?:this|last) week\b/.test(request)) {
    const start = new Date(weekStart(now));
    const lastWeek = request.includes('last week');
    if (lastWeek) start.setDate(start.getDate() - 7);
    const sessions = logs.filter(log => weekStart(localLogDate(log.date)) === start.getTime());
    const groups = weeklyMuscleSets(sessions, coach.customExercises, start.getTime());
    const period = lastWeek ? 'last week' : 'this week';
    return groups.length ? `Working sets by muscle ${period}\n${groups.map(([name, sets]) => `${name} · ${plural(sets, 'set')}`).join('\n')}`
      : `There are no working sets in your muscle chart ${period}.`;
  }
  if (!match && /\blast week\b/.test(request) && /\b(compare|comparison|versus|vs)\b/.test(request)) {
    const { thisWeek, lastWeek } = weeklySummaryFacts(logs, goal, now);
    return `This week · ${plural(thisWeek.workouts, 'workout')}, ${plural(thisWeek.sets, 'set')}\nLast week · ${plural(lastWeek.workouts, 'workout')}, ${plural(lastWeek.sets, 'set')}\nWeekly goal · ${thisWeek.workouts} of ${goal} workouts`;
  }
  if (unsupportedPeriod.test(request) || unsupportedTopic.test(request)
    || /\b(previous|past|this|last|next) \d+ (days?|weeks?|months?|years?)\b/.test(request)
  ) return fallback;

  const intent = classifyLogQuestion(request);
  if (!intent) return fallback;
  if (intent === 'week') {
    if (match) return fallback;
    const start = weekStart(now);
    const sessions = logs.filter(log => weekStart(localLogDate(log.date)) === start);
    const sets = sessions.reduce((count, log) => count + completedSetCount(log), 0);
    return `This week you logged ${plural(sessions.length, 'workout')} and ${plural(sets, 'set')}. Weekly goal: ${sessions.length} of ${goal} workouts.`;
  }
  if (intent === 'latest') {
    const latest = logs.find(log => !match || log.exercises.some(exercise => exercise.name === match.name));
    if (!latest) return 'Log a workout first and I can find it here.';
    if (match) {
      const sets = latest.exercises.filter(exercise => exercise.name === match.name).flatMap(exercise => {
        const mode = trackingOf(exercise);
        return exercise.sets.filter(set => isCompleteSet(set, mode)).map(set => formatSet(set, mode));
      });
      return `${match.name} · ${dateLabel(latest.date)}\n${sets.join(' · ') || 'No complete sets'}`;
    }
    return `${latest.routineName} · ${dateLabel(latest.date)}\n${plural(latest.exercises.length, 'exercise')} · ${plural(completedSetCount(latest), 'set')}\n${latest.exercises.map(exercise => exercise.name).join(', ')}`;
  }

  if (match) {
    const entries = Object.entries(Object.hasOwn(records, match.name) ? records[match.name] : {});
    if (!entries.length) return `No personal records saved for ${match.name} yet.`;
    const bestByMetric = new Map<string, string>();
    entries.sort(([, a], [, b]) => b.value - a.value);
    for (const [key, record] of entries) {
      const metric = progressMetric(key);
      if (bestByMetric.has(metric)) continue;
      const result = formatRecord(key, record.value);
      bestByMetric.set(metric, `${result.value} · ${result.label}`);
    }
    return `Best logged sets for ${match.name}\n${[...bestByMetric.values()].join('\n')}`;
  }

  const recent = Object.entries(records)
    .flatMap(([name, entries]) => Object.entries(entries).map(([key, entry]) => ({ name, key, ...entry })))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3);
  if (!recent.length) return 'Log a working set to start building your records.';
  return `Latest personal records\n${recent.map(({ name, key, value }) => {
    const result = formatRecord(key, value);
    return `${name} · ${result.value} · ${result.label}`;
  }).join('\n')}`;
}
