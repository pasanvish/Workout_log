import React, { useState, useMemo, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WorkoutLog, Profile, ProfilePRs } from '../types';
import BadgesDisplay from './BadgesDisplay';
import TrainingProgress from './TrainingProgress';
import ExerciseArtwork from './ExerciseArtwork';
import SetInputs from './SetInputs';
import {
  formatRecord, formatSet, isCompleteSet, PROGRESS_METRICS, progressMetric, recordCandidate, trackingOf,
  type ProgressMetric, type SetField,
} from '../setTracking';
import { EFFORT_LEVELS } from './WorkoutFeedbackModal';
import { exportName, saveExport, workoutReport } from '../exports';

interface WorkoutHistoryProps {
  logs: WorkoutLog[];
  onImportLogs: (data: unknown) => string;
  onDeleteLog: (logId: string) => void;
  onUpdateLog: (log: WorkoutLog) => void;
  onExportLogs: () => Promise<boolean>;
  onClose: () => void;
  activeProfile: Profile | undefined;
  personalRecords: ProfilePRs;
  view: HistoryView;
  onViewChange: (view: HistoryView) => void;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const UploadIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

const NoDataIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-card-dark mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const MedalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM5 15h10v3H5v-3z" />
    <path d="M10 5a1 1 0 011 1v1.586l.707.707a1 1 0 01-1.414 1.414L10 9.414l-.293.293a1 1 0 01-1.414-1.414L9 8.586V6a1 1 0 011-1z" />
  </svg>
);

const historyViews = ['Sessions', 'Progress', 'Records', 'Badges'] as const;
export type HistoryView = typeof historyViews[number];

const shortDate = (date: string) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const fullDate = (date: string) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const completedSets = (log: WorkoutLog) => log.exercises.flatMap(exercise =>
  exercise.sets.filter(set => isCompleteSet(set, trackingOf(exercise))),
);

const Chevron = ({ open }: { open: boolean }) => (
  <svg aria-hidden="true" className={`size-5 shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ logs, onImportLogs, onExportLogs, onClose, activeProfile, personalRecords, onDeleteLog, onUpdateLog, view, onViewChange }) => {
  const [fileStatus, setFileStatus] = useState('');
  const [fileBusy, setFileBusy] = useState(false);
  const [draft, setDraft] = useState<WorkoutLog | null>(null);

  const editSet = (exIndex: number, setIndex: number, field: SetField, value: string) => {
    setDraft(d => d && {
      ...d,
      exercises: d.exercises.map((ex, i) => i !== exIndex ? ex : {
        ...ex,
        sets: ex.sets.map((set, j) => j !== setIndex ? set : { ...set, [field]: value }),
      }),
    });
  };

  const handleDelete = (log: WorkoutLog) => {
    if (confirm(`Delete the ${log.routineName} session from ${new Date(log.date).toLocaleDateString()}? This can't be undone.`)) {
      onDeleteLog(log.id);
    }
  };

  const saveDraft = () => {
    if (draft) onUpdateLog(draft);
    setDraft(null);
  };

  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<ProgressMetric>();
  const [selectedRoutineFilter, setSelectedRoutineFilter] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const uniqueExercises = useMemo(() => {
    const exerciseSet = new Set<string>();
    logs.forEach(log => {
      log.exercises.forEach(ex => exerciseSet.add(ex.name));
    });
    return Array.from(exerciseSet).sort();
  }, [logs]);
  
  const uniqueRoutines = useMemo(() => {
      const routineSet = new Set<string>();
      logs.forEach(log => routineSet.add(log.routineName));
      return Array.from(routineSet).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (selectedRoutineFilter === null || !uniqueRoutines.includes(selectedRoutineFilter)) return logs;
    return logs.filter(log => log.routineName === selectedRoutineFilter);
  }, [logs, selectedRoutineFilter, uniqueRoutines]);

  const prExercises = useMemo(() => Object.keys(personalRecords).sort(), [personalRecords]);

  const exerciseFilter = selectedExercise && uniqueExercises.includes(selectedExercise) ? selectedExercise : uniqueExercises[0];
  const series = useMemo(() => {
    const result = new Map<ProgressMetric, { date: string; value: number }[]>();
    if (!exerciseFilter) return result;
    for (const log of [...logs].reverse()) {
      const best = new Map<ProgressMetric, number>();
      for (const exercise of log.exercises) {
        if (exercise.name !== exerciseFilter) continue;
        const mode = trackingOf(exercise);
        for (const set of exercise.sets) {
          const candidate = recordCandidate(set, mode);
          if (!candidate) continue;
          const metric = progressMetric(candidate.key);
          best.set(metric, Math.max(best.get(metric) ?? 0, candidate.value));
        }
      }
      for (const [metric, value] of best) {
        const points = result.get(metric) ?? [];
        points.push({ date: log.date, value });
        result.set(metric, points);
      }
    }
    return result;
  }, [logs, exerciseFilter]);
  const metric = selectedMetric && series.has(selectedMetric) ? selectedMetric
    : [...series.keys()].sort((a, b) => Date.parse(series.get(b)!.at(-1)!.date) - Date.parse(series.get(a)!.at(-1)!.date))[0];
  const metricInfo = metric ? PROGRESS_METRICS[metric] : undefined;
  const chartData = metric ? series.get(metric)! : [];
  const latestPoint = chartData.at(-1);
  const bestValue = chartData.reduce((best, point) => Math.max(best, point.value), 0);
  const allSetCount = useMemo(() => logs.reduce((sum, log) => sum + completedSets(log).length, 0), [logs]);
  const recordCount = prExercises.reduce((sum, exercise) => sum + Object.keys(personalRecords[exercise]).length, 0);
  const monthGroups = useMemo(() => {
    const groups = new Map<string, WorkoutLog[]>();
    for (const log of filteredLogs) {
      const month = new Date(log.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const group = groups.get(month);
      if (group) group.push(log);
      else groups.set(month, [log]);
    }
    return [...groups];
  }, [filteredLogs]);

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setFileBusy(true);
    try {
      setFileStatus(onImportLogs(JSON.parse(await file.text())));
    } catch {
      setFileStatus('Import failed. Choose a valid Gym Logger JSON backup.');
    } finally {
      setFileBusy(false);
    }
  };

  const exportFile = async (action: () => Promise<boolean>) => {
    setFileBusy(true);
    setFileStatus('');
    try {
      const saved = await action();
      setFileStatus(saved ? 'Export ready. Check the location you chose or your downloads.' : 'Export canceled.');
    } catch {
      setFileStatus('Could not save the export. Try again or choose another location.');
    } finally {
      setFileBusy(false);
    }
  };

  const exportReport = () => activeProfile ? saveExport({
    filename: exportName('gym-workouts', activeProfile.name, 'html'),
    mimeType: 'text/html',
    content: workoutReport(activeProfile.name, logs),
  }) : Promise.resolve(false);

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border-color/60 bg-background-light px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <div className="min-w-0">
          <h2 id="history-drawer-title" className="text-2xl font-bold tracking-tight">Workout history</h2>
          {activeProfile && <p className="truncate text-xs text-text-secondary mt-1">{activeProfile.name}</p>}
        </div>
        <button onClick={onClose} className="icon-action" aria-label="Close history">
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="m6 6 12 12M6 18 18 6" /></svg>
        </button>
      </header>

      <nav aria-label="History views" className="segmented-control mx-4 mt-4 sm:mx-6">
        {historyViews.map(label => (
          <button type="button" key={label} onClick={() => onViewChange(label)} aria-pressed={view === label}>{label}</button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
        {view === 'Sessions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2.5">
              {[[logs.length, 'Sessions'], [allSetCount, 'Sets logged'], [recordCount, 'Rep records']].map(([value, label]) => (
                <div key={label} className="stat-card">
                  <span className="text-2xl font-bold tabular-nums text-brand-light">{value}</span>
                  <span className="mt-1 text-xs text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
            {logs.length > 0 ? (
              <>
                <button type="button" onClick={() => onViewChange('Progress')} className="progress-link">
                  <span className="session-date !size-10" aria-hidden="true">
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19h16M6 14l4-4 4 2 4-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm">View progress</strong><span className="block text-xs text-text-secondary">Weekly activity and strength trends</span></span>
                  <span aria-hidden="true" className="text-brand-light">→</span>
                </button>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Session log</h3>
                  <select aria-label="Filter sessions by routine" className="track-input min-w-0 max-w-[56%]" value={selectedRoutineFilter === null || !uniqueRoutines.includes(selectedRoutineFilter) ? '' : 'routine:' + selectedRoutineFilter} onChange={event => setSelectedRoutineFilter(event.target.value ? event.target.value.slice(8) : null)}>
                    <option value="">All routines</option>
                    {uniqueRoutines.map(name => <option key={name} value={'routine:' + name}>{name}</option>)}
                  </select>
                </div>
                {monthGroups.map(([month, sessions]) => (
                  <section key={month} className="space-y-3">
                    <h4 className="text-xs font-semibold text-text-secondary">{month}</h4>
                    {sessions.map(log => {
                      const date = new Date(log.date);
                      const isExpanded = expandedLogs.has(log.id);
                      const effort = EFFORT_LEVELS.find(item => item.level === log.effort);
                      const sets = completedSets(log);
                      const editing = draft?.id === log.id;
                      return (
                        <article key={log.id} className="session-history-card">
                          <button className="flex w-full items-center gap-3 px-3 py-4 text-left hover:bg-card-dark/50 sm:px-4" onClick={() => toggleLogExpansion(log.id)} aria-expanded={isExpanded} aria-controls={isExpanded ? `log-${log.id}` : undefined}>
                            <span className="session-date" aria-label={fullDate(log.date)}>
                              <span className="text-[10px] font-semibold uppercase">{date.toLocaleDateString(undefined, { month: 'short' })}</span>
                              <span className="text-xl font-bold leading-none tabular-nums">{date.getDate()}</span>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block break-words font-bold">{log.routineName}</span>
                              <span className="mt-1 block text-xs text-text-secondary">{log.exercises.length} {log.exercises.length === 1 ? 'exercise' : 'exercises'} · {sets.length} {sets.length === 1 ? 'set' : 'sets'}</span>
                              <span className="mt-2 flex flex-wrap gap-1.5">
                                {effort && <span className="history-chip" aria-label={`Effort: ${effort.label}`}>{effort.label}</span>}
                                {sets.some(set => set.isPR) && <span className="history-chip text-yellow-300">Personal record</span>}
                              </span>
                            </span>
                            <Chevron open={isExpanded} />
                          </button>
                          {isExpanded && (
                            <div id={`log-${log.id}`} className="space-y-3 border-t border-border-color/60 p-3 sm:p-4">
                              {(editing ? draft : log).exercises.map((exercise, exIndex) => (
                                <section key={exIndex} className="rounded-xl border border-border-color/60 bg-background-dark p-3">
                                  <div className="mb-2 flex items-center gap-2.5">
                                    <ExerciseArtwork name={exercise.name} className="!w-9 shrink-0 !rounded-lg" />
                                    <h5 className="min-w-0 break-words text-sm font-semibold">{exercise.name}</h5>
                                  </div>
                                  <ul className={editing ? 'grid gap-2' : 'grid grid-cols-2 gap-2 sm:grid-cols-3'}>
                                    {exercise.sets.map((set, setIndex) => (
                                      <li key={set.id} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-background-light px-2.5 py-2 text-xs">
                                        <span className="text-text-secondary">Set {setIndex + 1}</span>
                                        {editing ? (
                                          <div className="ml-auto w-full max-w-[200px]">
                                            <SetInputs exerciseName={exercise.name} set={set} index={setIndex} mode={trackingOf(exercise)} showLabels
                                              onChange={(field, value) => editSet(exIndex, setIndex, field, value)} />
                                          </div>
                                        ) : (
                                          <span className="font-medium tabular-nums">{formatSet(set, trackingOf(exercise))} {set.isPR && <span className="ml-1 text-yellow-300">PR</span>}</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </section>
                              ))}
                              <div className="flex justify-end gap-2">
                                {editing ? <>
                                  <button className="panel-action" onClick={() => setDraft(null)}>Cancel</button>
                                  <button className="panel-action panel-action-primary" onClick={saveDraft}>Save changes</button>
                                </> : <>
                                  <button className="panel-action" onClick={() => setDraft(log)}>Edit session</button>
                                  <button className="panel-action text-red-300" onClick={() => handleDelete(log)}>Delete</button>
                                </>}
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </section>
                ))}
              </>
            ) : (
              <div className="empty-session">
                <NoDataIcon />
                <h3 className="mt-3 text-lg font-semibold">No workouts logged yet</h3>
                <p className="mt-1 text-sm text-text-secondary">Log your first session or import an existing backup.</p>
                <button onClick={onClose} className="panel-action panel-action-primary mt-4">Back to workout</button>
              </div>
            )}
          </div>
        )}

        {view === 'Progress' && (
          <div className="space-y-4">
            <TrainingProgress logs={logs} />
            <section className="tracking-panel">
              <h3 className="text-lg font-semibold">Exercise progress</h3>
              <p className="mt-1 text-sm text-text-secondary">{metricInfo?.description ?? 'Track weight, bodyweight reps, or hold duration.'}</p>
              {uniqueExercises.length > 0 ? (
                <>
                  <label htmlFor="exercise-select" className="mt-4 block text-xs font-medium text-text-secondary">Exercise</label>
                  <select id="exercise-select" value={exerciseFilter} onChange={event => { setSelectedExercise(event.target.value); setSelectedMetric(undefined); }} className="track-input mt-1.5 w-full">
                    {uniqueExercises.map(exercise => <option key={exercise} value={exercise}>{exercise}</option>)}
                  </select>
                  {series.size > 1 && (
                    <div role="group" aria-label="Progress metric" className="mt-3 flex flex-wrap gap-1.5">
                      {[...series.keys()].map(value => <button type="button" key={value} aria-pressed={metric === value} className="category-chip"
                        onClick={() => setSelectedMetric(value)}>{PROGRESS_METRICS[value].label}</button>)}
                    </div>
                  )}
                  {latestPoint && metricInfo && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="stat-card"><span className="text-xs text-text-secondary">Latest</span><strong className="mt-1 text-xl tabular-nums">{metricInfo.sample(latestPoint.value)}</strong></div>
                      <div className="stat-card"><span className="text-xs text-text-secondary">Best</span><strong className="mt-1 text-xl tabular-nums text-brand-light">{metricInfo.sample(bestValue)}</strong></div>
                    </div>
                  )}
                  {chartData.length > 1 ? (
                    <div className="mt-5 h-56 min-w-0" aria-label={`${metricInfo?.label ?? 'Exercise progress'} by session`}>
                      <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 2 }}>
                          <defs><linearGradient id="strength-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="rgb(var(--brand-light))" stopOpacity={0.28} /><stop offset="100%" stopColor="rgb(var(--brand-light))" stopOpacity={0.02} /></linearGradient></defs>
                          <CartesianGrid vertical={false} stroke="#2c3d49" strokeDasharray="3 4" />
                          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#9cafbc', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                          <YAxis tick={{ fill: '#9cafbc', fontSize: 11 }} tickLine={false} axisLine={false} />
                          <Tooltip labelFormatter={fullDate} formatter={value => [metricInfo?.sample(Number(value)) ?? value, metricInfo?.label ?? 'Result']} contentStyle={{ background: '#121c24', borderColor: '#2c3d49', borderRadius: 12 }} />
                          <Area dataKey="value" type="linear" stroke="rgb(var(--brand-light))" fill="url(#strength-fill)" strokeWidth={2.5} dot={{ r: 3, fill: 'rgb(var(--brand-light))' }} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="mt-5 rounded-xl bg-background-dark p-4 text-sm text-text-secondary">Log this type of set in two sessions to see a trend.</p>}
                </>
              ) : <p className="mt-5 text-sm text-text-secondary">Log your first workout to start tracking progress.</p>}
            </section>
          </div>
        )}

        {view === 'Records' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold">Personal records</h3>
              <p className="mt-1 text-sm text-text-secondary">Your heaviest sets, most bodyweight reps, and longest holds.</p>
            </div>
            {prExercises.length === 0 && <p className="tracking-panel text-sm text-text-secondary">Log a set to start tracking your records.</p>}
            {prExercises.map(exercise => (
              <section key={exercise} className="tracking-panel">
                <div className="mb-4 flex items-center gap-3">
                  <ExerciseArtwork name={exercise} className="!w-11 shrink-0 !rounded-lg" />
                  <h4 className="flex-1 font-semibold">{exercise}</h4>
                  <MedalIcon />
                </div>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(personalRecords[exercise]).map(([key, record]) => {
                    const formatted = formatRecord(key, record.value);
                    return (
                      <li key={key} className="rounded-xl border border-border-color/60 bg-background-dark p-3">
                        <span className="text-xs text-text-secondary">{formatted.label}</span>
                        <strong className="block text-lg tabular-nums text-brand-light">{formatted.value}</strong>
                        <span className="text-xs text-text-secondary">{fullDate(record.date)}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
        {view === 'Badges' && (
          <section className="tracking-panel">
            <h3 className="mb-2 text-lg font-semibold">Achievements</h3>
            <BadgesDisplay logs={logs} />
          </section>
        )}
        <details className="mt-7 rounded-xl border border-border-color/70 bg-background-light">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Import &amp; export</summary>
          <div className="flex flex-wrap gap-2 border-t border-border-color/60 p-3">
            <button onClick={handleImportClick} className="panel-action" disabled={fileBusy}><UploadIcon /> Import backup</button>
            <button onClick={() => void exportFile(onExportLogs)} className="panel-action" disabled={fileBusy}><DownloadIcon /> Full backup (.json)</button>
            {logs.length > 0 && <button onClick={() => void exportFile(exportReport)} className="panel-action" disabled={fileBusy}><DownloadIcon /> Workout report (.html)</button>}
          </div>
          {fileStatus && <p role="status" className="px-4 pb-3 text-sm text-text-secondary">{fileStatus}</p>}
        </details>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,application/json" hidden />
      </div>
    </>
  );
};

export default WorkoutHistory;
