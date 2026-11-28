import React, { useEffect, useMemo, useRef, useState } from 'react';
import { hasNativeAi, localAi, workoutRecap, type ModelId } from '../localAi';
import { weeklyCoach } from '../weeklyCoach';
import type { WeeklyPlan } from '../weeklyPlan';
import type { CustomExercise, CustomRoutine, WorkoutLog } from '../types';

const mb = (bytes: number) => Math.round(bytes / 1_000_000);

const models = {
  lite: { label: 'Lite', description: 'A one-sentence recap using the smaller download.' },
  qwen: { label: 'Standard', description: 'A week-to-week recap using a larger model.' },
};

interface Props {
  logs: WorkoutLog[];
  customExercises: CustomExercise[];
  routines: CustomRoutine[];
  plan: WeeklyPlan;
  goal: number;
  active: boolean;
  onMuscles: () => void;
}

export default function OfflineAi({ logs, customExercises, routines, plan, goal, active, onMuscles }: Props) {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof localAi.status>>>();
  const [bridgeError, setBridgeError] = useState('');
  const [error, setError] = useState<{ model: ModelId; message: string }>();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ key: string; model: ModelId; label: string; summary: string; generated: boolean }>();
  const pending = useRef(false);
  const coach = useMemo(() => weeklyCoach(logs, customExercises, goal, plan, routines), [logs, customExercises, goal, plan, routines]);
  const { weekly } = coach;
  const nativeBusy = Boolean(status?.busy);

  useEffect(() => {
    if (!active || !hasNativeAi) return;
    let current = true;
    const refresh = async () => {
      try {
        const update = await localAi.status();
        if (current) {
          setStatus(update);
          setBridgeError('');
        }
      } catch {
        if (current) setBridgeError('Offline AI is unavailable in this Android build.');
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, nativeBusy || busy ? 800 : 4_000);
    return () => { current = false; window.clearInterval(timer); };
  }, [active, nativeBusy, busy]);

  async function run(model: ModelId, action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await action();
      setStatus(await localAi.status());
    } catch (reason) {
      setError({ model, message: reason instanceof Error ? reason.message : 'Could not complete that action.' });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const remove = (model: ModelId) => void run(model, async () => {
    await localAi.remove({ model });
    setReport(current => current?.model === model ? undefined : current);
  });

  const summarize = (model: ModelId, label: string) => void run(model, async () => {
    setReport(undefined);
    const lite = workoutRecap('lite', '', weekly).summary;
    const facts = model === 'lite' ? `Rewrite this as a short fitness recap. ${lite}` : weekly.facts;
    const { summary } = await localAi.summarize({ model, facts });
    setReport({ key: weekly.key, model, label, ...workoutRecap(model, summary, weekly) });
  });

  return (
    <section className="tracking-panel">
      <div className="flex items-start gap-3">
        <span className="session-date !size-10" aria-hidden="true">
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.5 14.5 9 21 12l-6.5 3-2.5 6.5L9 15l-6.5-3L9 9 12 2.5ZM19 3v4m-2-2h4" />
          </svg>
        </span>
        <div>
          <h3 className="text-lg font-semibold">Weekly coach</h3>
          <p className="text-sm text-text-secondary">See what you trained and what you can focus on next. Calculated on this device.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-background-dark p-3">
          <p className="text-xs text-text-secondary">This week</p>
          <strong className="block text-sm tabular-nums">{weekly.thisWeek.workouts} / {goal} workouts</strong>
          <p className="text-xs text-text-secondary">{weekly.thisWeek.sets} logged {weekly.thisWeek.sets === 1 ? 'set' : 'sets'}</p>
        </div>
        <div className="rounded-xl bg-background-dark p-3">
          <p className="text-xs text-text-secondary">Last week</p>
          <strong className="block text-sm tabular-nums">{weekly.lastWeek.workouts} {weekly.lastWeek.workouts === 1 ? 'workout' : 'workouts'}</strong>
          <p className="text-xs text-text-secondary">{weekly.lastWeek.sets} logged {weekly.lastWeek.sets === 1 ? 'set' : 'sets'}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2" aria-live="polite">
        {coach.focus.map((item, index) => (
          <div key={item.id} className={`rounded-xl border p-3 ${index === 0 ? 'border-brand-light/60' : 'border-border-color/60'}`}>
            <h4 className="text-sm font-semibold">{item.title}</h4>
            <p className="mt-1 text-xs text-text-secondary">{item.detail}</p>
            {item.id === 'balance' && <button className="panel-action mt-2" type="button" onClick={onMuscles}>View muscles</button>}
          </div>
        ))}
      </div>
      {hasNativeAi && <details className="mt-3 rounded-xl border border-border-color/60 p-3">
        <summary className="cursor-pointer text-sm font-semibold">Optional offline AI models</summary>
        {bridgeError && <p className="mt-3 text-sm text-red-300" role="alert">{bridgeError}</p>}
        <div className="mt-4 space-y-2">
          {status?.models.map(({ id, name, state, bytes, total, message, compact }) => {
            const { label, description } = compact
              ? { label: 'Compact', description: 'Week-to-week recaps on supported 4 GB phones with enough free memory.' }
              : models[id];
            const transferring = state === 'downloading' || state === 'pausing' || state === 'verifying';
            const installed = state === 'ready' || state === 'generating';
            const disabled = busy || nativeBusy;
            const actionError = error?.model === id ? error.message : state !== 'unsupported' ? message : '';
            return (
              <section key={id} className="rounded-xl border border-border-color/60 bg-background-dark p-3">
                <div className="flex flex-wrap justify-between gap-x-2 text-sm">
                  <h4 className="font-bold">{label} <span className="font-normal text-text-secondary">· {name}</span></h4>
                  <span className="text-xs text-text-secondary">{installed ? 'Installed' : `${mb(total)} MB download`}</span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">{state === 'unsupported' ? message : description}</p>
                {(transferring || state === 'paused') && <>
                  <progress className="session-progress mt-3" aria-label={`${label} model download`} value={bytes} max={total} />
                  <p className="mt-1 text-xs tabular-nums text-text-secondary" role="status">
                    {state === 'verifying' ? 'Checking model file…' : state === 'pausing' ? 'Pausing…' : `${mb(bytes)} of ${mb(total)} MB${state === 'paused' ? ' · Paused' : ''}`}
                  </p>
                </>}
                {state !== 'unsupported' && <div className="mt-2 flex flex-wrap gap-2">
                  {(state === 'available' || state === 'paused') && <button type="button" className="panel-action panel-action-primary disabled:opacity-50"
                    disabled={disabled} onClick={() => void run(id, () => localAi.download({ model: id }))}>
                    {state === 'paused' ? `Resume ${label}` : `Download ${label}`}
                  </button>}
                  {state === 'downloading' && <button type="button" className="panel-action" disabled={busy}
                    onClick={() => void run(id, () => localAi.pause({ model: id }))}>Pause download</button>}
                  {installed && <button type="button" className="panel-action panel-action-primary disabled:opacity-50"
                    disabled={disabled || !weekly.thisWeek.workouts} onClick={() => summarize(id, label)}>
                    {state === 'generating' ? 'Writing recap…' : `Summarize with ${label}`}
                  </button>}
                  {(state === 'ready' || state === 'paused') && <button type="button" className="panel-action" disabled={disabled}
                    onClick={() => remove(id)}>{state === 'paused' ? 'Discard download' : `Remove ${label}`}</button>}
                </div>}
                {state === 'ready' && !weekly.thisWeek.workouts && <p className="mt-2 text-xs text-text-secondary">Log a workout this week to review your training.</p>}
                {actionError && <p className="mt-2 text-xs text-red-300" role="alert">{actionError}</p>}
              </section>
            );
          })}
        </div>
      </details>}
      {report?.key === weekly.key && <div className="mt-3 space-y-2 rounded-xl bg-background-dark p-3" role="status">
        <p className="text-xs font-semibold text-brand-light">{report.generated ? `AI recap · ${report.label}` : 'Recap from your log'}</p>
        <p className="whitespace-pre-wrap break-words text-sm">{report.summary}</p>
        <p className="text-xs text-text-secondary">{weekly.thisWeek.workouts} workouts · {weekly.thisWeek.sets} sets in your log</p>
      </div>}
    </section>
  );
}
