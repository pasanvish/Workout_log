import { MASTER_EXERCISE_LIST } from './constants.ts';
import { defaultTracking, isCompleteSet, isRpe, MAX_EXERCISE_NOTES } from './setTracking.ts';
import { clearUnpairedSupersets } from './workoutFlow.ts';
import type { CustomExercise, Exercise, Set as LoggedSet, SetType, TrackingMode, WorkoutLog } from './types';

type WeightUnit = 'kg' | 'lb';
type DateOrder = 'dmy' | 'mdy';
type Source = 'Hevy' | 'Strong' | 'FitNotes';

const exerciseKey = (value: string) => value.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.join('') ?? '';
const knownNames = new Map(Object.values(MASTER_EXERCISE_LIST).flat().map(name => [exerciseKey(name), name]));
const aliases = new Map([
  ['benchpress', 'Bench Press (Barbell)'], ['inclinebenchpress', 'Incline Bench Press (Barbell)'],
  ['declinebenchpress', 'Decline Bench Press (Barbell)'], ['benchpressdumbbell', 'Dumbbell Press'],
  ['inclinebenchpressdumbbell', 'Incline Dumbbell Press'], ['squatbarbell', 'Barbell Squats'],
  ['barbellsquat', 'Barbell Squats'], ['deadliftbarbell', 'Deadlift'], ['romaniandeadliftbarbell', 'Romanian Deadlift'],
  ['pulldowncable', 'Lat Pulldowns'], ['latpulldowncable', 'Lat Pulldowns'], ['latpulldown', 'Lat Pulldowns'],
  ['pushup', 'Push-ups'], ['pullup', 'Pull-ups'], ['chinup', 'Chin-ups'], ['sideplank', 'Side Plank'],
]);

function readCsv(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && !cell.trim()) {
      quoted = true;
      cell = '';
    } else if (char === delimiter) {
      row.push(cell.trim());
      cell = '';
    } else if (char === '\n' || char === '\r') {
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      if (char === '\r' && text[index + 1] === '\n') index++;
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error('The CSV ends inside a quoted value. Export the file again.');
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (value: string | number) => String(value).padStart(2, '0');

const numericDate = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})(.*)$/;

function csvDate(raw: string, dateOrder: DateOrder) {
  const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(.*)$/.exec(raw);
  const words = /^(\d{1,2})\s+([a-z]{3,9})\s+(\d{4})(.*)$/i.exec(raw);
  const numeric = numericDate.exec(raw);
  const dayFirst = numeric && (Number(numeric[1]) > 12 || (Number(numeric[2]) <= 12 && dateOrder === 'dmy'));
  const parts = iso ? iso.slice(1) : words
    ? [words[3], String(months.indexOf(words[2].slice(0, 3).toLowerCase()) + 1), words[1], words[4]]
    : numeric ? [numeric[3], dayFirst ? numeric[2] : numeric[1], dayFirst ? numeric[1] : numeric[2], numeric[4]]
      : undefined;
  if (!parts) return;
  const [year, month, day, tail] = parts;
  const date = `${year}-${pad(month)}-${pad(day)}`;
  const dateNumber = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(dateNumber) || new Date(dateNumber).toISOString().slice(0, 10) !== date) return;
  if (!tail.trim()) return date;
  const time = /^[T ,]*(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(AM|PM)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(tail);
  if (!time) return;
  let hour = Number(time[1]);
  if (time[4]) {
    if (hour < 1 || hour > 12) return;
    hour = hour % 12 + (time[4].toLowerCase() === 'pm' ? 12 : 0);
  }
  if (hour > 23 || Number(time[2]) > 59 || Number(time[3] ?? 0) > 59) return;
  const value = `${date}T${pad(hour)}:${time[2]}:${time[3] ?? '00'}${time[5]?.toUpperCase() ?? ''}`;
  return Number.isFinite(Date.parse(value)) ? value : undefined;
}

function numberIn(value: string) {
  if (!/^-?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value)) return undefined;
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) ? number : undefined;
}

function durationIn(value: string) {
  if (!/^\d+(?::\d{1,2}){1,2}$/.test(value)) return Math.round(numberIn(value) ?? 0);
  return value.split(':').reduce((seconds, part) => seconds * 60 + Number(part), 0);
}

function setTypeOf(value: string): SetType | undefined {
  const name = value.toLowerCase().replace(/[ _-]/g, '');
  if (['w', 'warmup'].includes(name)) return 'warmup';
  if (['d', 'drop', 'dropset'].includes(name)) return 'drop';
  if (['f', 'failure', 'tofailure'].includes(name)) return 'failure';
}

interface ImportedExercise extends Exercise {
  category: string;
  notesSeen: Set<string>;
  orderedSets: { set: LoggedSet; order?: number; row: number }[];
}

export interface HistoryImport {
  source: Source;
  workoutLogs: WorkoutLog[];
  customExercises: CustomExercise[];
  skippedRows: number;
  needsWeightUnit: boolean;
  needsDateOrder: boolean;
  timedDistanceRows: number;
}

export function parseHistoryCsv(text: string, fallbackUnit: WeightUnit, customs: CustomExercise[] = [], dateOrder?: DateOrder): HistoryImport {
  const headerLine = text.replace(/^\uFEFF/, '').trimStart().split(/\r?\n/, 1)[0];
  const width = (delimiter: string) => readCsv(headerLine, delimiter)[0]?.length ?? 0;
  const delimiter = [',', ';', '\t'].sort((a, b) => width(b) - width(a))[0];
  const [headers = [], ...rows] = readCsv(text.replace(/^\uFEFF/, ''), delimiter);
  const columns = headers.map(exerciseKey);
  const index = (...names: string[]) => names.map(name => columns.indexOf(name)).find(column => column >= 0) ?? -1;
  const titleColumn = index('title', 'workoutname');
  const hevy = index('starttime') >= 0 && index('exercisetitle') >= 0;
  const strong = index('date') >= 0 && index('exercisename') >= 0 && titleColumn >= 0;
  const fitNotes = index('date', 'workoutdate') >= 0 && index('exercise') >= 0 && index('category') >= 0;
  const source = hevy ? 'Hevy' : strong ? 'Strong' : fitNotes ? 'FitNotes' : undefined;
  if (!source) throw new Error('Choose a workout CSV exported from Hevy, Strong, or FitNotes.');
  const customNames = new Map(customs.map(item => [exerciseKey(item.name), item.name]));
  const unknownNames = new Map<string, string>();
  const kgColumn = index('weightkg', 'weightkgs');
  const lbColumn = index('weightlbs', 'weightlb');
  const weightColumn = index('weight');
  const weightUnitColumn = index('weightunit', 'unit');
  let needsWeightUnit = false;
  let skippedRows = 0;
  let timedDistanceRows = 0;
  const sessions = new Map<string, { date: string; title: string; exercises: Map<string, ImportedExercise> }>();
  const fields = {
    date: index('starttime', 'date', 'workoutdate'), name: index('exercisetitle', 'exercisename', 'exercise'),
    reps: index('reps', 'repetitions'), seconds: index('durationseconds', 'seconds', 'time', 'duration'),
    type: index('settype', 'kind'), order: index('setindex', 'setorder'), rpe: index('rpe'),
    superset: index('supersetid'), notes: index('exercisenotes', 'notes', 'comment', 'comments'),
    category: index('category'), distance: index('distancekm', 'distancemiles', 'distancemeters', 'distance'),
  };
  // Strong's Duration field describes the session. Its Seconds field describes an individual set.
  if (strong) fields.seconds = index('seconds', 'durationseconds');

  const numericDates = rows.flatMap(row => {
    const match = numericDate.exec(row[fields.date] ?? '');
    return match ? [[Number(match[1]), Number(match[2])] as const] : [];
  });
  const dayFirst = numericDates.some(([first, second]) => first > 12 && second <= 12);
  const monthFirst = numericDates.some(([first, second]) => second > 12 && first <= 12);
  const inferredOrder = dayFirst !== monthFirst ? (dayFirst ? 'dmy' : 'mdy') : undefined;
  const needsDateOrder = !inferredOrder && numericDates.some(([first, second]) => first <= 12 && second <= 12 && first !== second);

  rows.forEach((row, rowIndex) => {
    const cell = (column: number) => row[column] ?? '';
    const date = csvDate(cell(fields.date), dateOrder ?? inferredOrder ?? 'dmy');
    const rawName = cell(fields.name).slice(0, 150);
    const key = exerciseKey(rawName);
    const repsInput = numberIn(cell(fields.reps));
    const reps = repsInput && repsInput > 0 && Number.isSafeInteger(repsInput) ? repsInput : undefined;
    const seconds = durationIn(cell(fields.seconds));
    const distance = numberIn(cell(fields.distance)) ?? 0;
    if (!date || !key || row.slice(headers.length).some(Boolean) || (!reps && seconds <= 0)) {
      skippedRows++;
      return;
    }
    const kilos = numberIn(cell(kgColumn));
    const pounds = numberIn(cell(lbColumn));
    const rawWeight = numberIn(cell(weightColumn));
    const unit = cell(weightUnitColumn).toLowerCase();
    const hasUnit = /^(?:kg|kgs|lb|lbs)$/.test(unit);
    const needsRowUnit = kilos === undefined && pounds === undefined && rawWeight !== undefined && rawWeight !== 0 && !hasUnit;
    needsWeightUnit ||= needsRowUnit;
    const lb = pounds ?? (unit.startsWith('lb') || (!hasUnit && fallbackUnit === 'lb') ? rawWeight : undefined);
    const weight = kilos ?? (lb === undefined ? rawWeight : Math.round(lb * 0.45359237 * 1000) / 1000);
    if ([kgColumn, lbColumn, weightColumn].some(column => cell(column) && numberIn(cell(column)) === undefined)) {
      skippedRows++;
      return;
    }
    const name = customNames.get(key) ?? knownNames.get(key) ?? aliases.get(key) ?? unknownNames.get(key) ?? rawName;
    unknownNames.set(key, name);
    const normalMode = defaultTracking(name, customs);
    const mode: TrackingMode = seconds > 0 && (!reps || distance > 0 || normalMode === 'duration') ? 'duration'
      : weight && weight < 0 ? 'weight'
      : normalMode === 'bodyweight' || weight === undefined || (!weight && !knownNames.has(exerciseKey(name))) ? 'bodyweight' : 'weight';
    const orderText = cell(fields.order);
    const order = numberIn(orderText);
    const rpe = numberIn(cell(fields.rpe));
    const set: LoggedSet = {
      id: `csv-set-${rowIndex + 1}`,
      weight: mode === 'duration' || weight === undefined || (mode === 'bodyweight' && !weight) ? '' : String(weight),
      reps: mode === 'duration' || !reps ? '' : String(reps),
      ...(mode === 'duration' ? { seconds: String(seconds) } : {}),
      setType: setTypeOf(cell(fields.type) || orderText),
      ...(isRpe(rpe) ? { rpe } : {}),
    };
    if (!isCompleteSet(set, mode)) {
      skippedRows++;
      return;
    }
    const title = source === 'FitNotes' ? 'FitNotes workout' : cell(titleColumn).slice(0, 180) || `${source} workout`;
    const when = source === 'FitNotes' ? date.slice(0, 10) : date;
    const id = `csv:${source.toLowerCase()}:${when}:${title}`;
    const session = sessions.get(id) ?? { date: when, title, exercises: new Map<string, ImportedExercise>() };
    sessions.set(id, session);
    const lift = `${name}\u0000${mode}`;
    const superset = cell(fields.superset);
    const exercise = session.exercises.get(lift) ?? {
      name, tracking: mode, sets: [], orderedSets: [], notesSeen: new Set<string>(),
      category: cell(fields.category).slice(0, 80) || (distance > 0 ? 'Cardio' : 'Imported'),
      superset: /^[a-zA-Z0-9_-]{1,56}$/.test(superset) && superset !== '0' ? `csv-${superset}` : undefined,
    };
    session.exercises.set(lift, exercise);
    exercise.orderedSets.push({ set, order, row: rowIndex });
    const notes = cell(fields.notes);
    if (notes) exercise.notesSeen.add(notes);
    if (mode === 'duration' && distance > 0) timedDistanceRows++;
  });

  const libraryNames = new Set([...knownNames.values(), ...customs.map(item => item.name)]);
  const customExercises = new Map<string, CustomExercise>();
  const workoutLogs = [...sessions].map(([id, { date, title, exercises }]) => ({
    id, date, routineName: title,
    exercises: clearUnpairedSupersets([...exercises.values()].map(({ notesSeen, orderedSets, category, ...exercise }) => {
      if (!libraryNames.has(exercise.name) && !customExercises.has(exercise.name)) {
        customExercises.set(exercise.name, { id: `csv-exercise:${exerciseKey(exercise.name)}`, name: exercise.name, category, tracking: exercise.tracking });
      }
      const hasNumericOrder = orderedSets.every(item => item.order !== undefined);
      if (hasNumericOrder) orderedSets.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.row - b.row);
      return {
        ...exercise,
        sets: orderedSets.map(item => item.set),
        notes: [...notesSeen].join('\n').slice(0, MAX_EXERCISE_NOTES) || undefined,
      };
    })),
  }));
  return { source, workoutLogs, customExercises: [...customExercises.values()], skippedRows, needsWeightUnit, needsDateOrder, timedDistanceRows };
}
