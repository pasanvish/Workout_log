import React, { useEffect, useRef, useState } from 'react';
import { formatLiteRecap, localAi, weeklySummaryFacts, type ModelId } from '../localAi';
import type { WorkoutLog } from '../types';

const mb = (bytes: number) => Math.round(bytes / 1_000_000);

const models = {
  lite: { label: 'Lite', description: 'A short recap for phones with about 4 GB of RAM.' },
  qwen: { label: 'Standard', description: 'A recap with a week-to-week comparison on phones with about 6 GB of RAM.' },
};

export default function OfflineAi({ logs, goal, active }: { logs: WorkoutLog[]; goal: number; active: boolean }) {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof localAi.status>>>();
  const [bridgeError, setBridgeError] = useState('');
  const [error, setError] = useState<{ model: ModelId; message: string }>();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ key: string; model: ModelId; summary: string; generated: boolean }>();
  const pending = useRef(false);
  const weekly = weeklySummaryFacts(logs, goal);
  const nativeBusy = Boolean(status?.busy);

  useEffect(() => {
    if (!active) return;
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

  const summarize = (model: ModelId) => void run(model, async () => {
    setReport(undefined);
    const { summary } = await localAi.summarize({ model, facts: model === 'lite' ? weekly.litePrompt : weekly.facts });
    const recap = model === 'lite'
      ? formatLiteRecap(summary, weekly.thisWeek.workouts, weekly.thisWeek.sets)
      : { summary, generated: true };
    setReport({ key: weekly.key, model, ...recap });
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
          <h3 className="text-lg font-semibold">Offline AI summary</h3>
          <p className="text-sm text-text-secondary">Download a model for weekly recaps. Your workout data stays on this phone.</p>
        </div>
      </div>
      {bridgeError && <p className="mt-3 text-sm text-red-300" role="alert">{bridgeError}</p>}
      <div className="mt-4 space-y-2">
        {status?.models.map(({ id, name, state, bytes, total, message }) => {
          const { label, description } = models[id];
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
                  disabled={disabled || !weekly.thisWeek.workouts} onClick={() => summarize(id)}>
                  {state === 'generating' ? 'Writing summary…' : `Summarize with ${label}`}
                </button>}
                {(state === 'ready' || state === 'paused') && <button type="button" className="panel-action" disabled={disabled}
                  onClick={() => remove(id)}>{state === 'paused' ? 'Discard download' : `Remove ${label}`}</button>}
              </div>}
              {state === 'ready' && !weekly.thisWeek.workouts && <p className="mt-2 text-xs text-text-secondary">Log a workout this week to generate a recap.</p>}
              {actionError && <p className="mt-2 text-xs text-red-300" role="alert">{actionError}</p>}
            </section>
          );
        })}
      </div>
      {report?.key === weekly.key && <div className="mt-3 space-y-2 rounded-xl bg-background-dark p-3" role="status">
        <p className="text-xs font-semibold text-brand-light">{report.generated ? `AI recap · ${models[report.model].label}` : 'Recap from your log'}</p>
        <p className="whitespace-pre-wrap break-words text-sm">{report.summary}</p>
        <p className="text-xs text-text-secondary">{weekly.thisWeek.workouts} workouts · {weekly.thisWeek.sets} sets in your log</p>
      </div>}
    </section>
  );
}
