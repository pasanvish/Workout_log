import React, { useEffect, useRef, useState } from 'react';
import { localAi, weeklySummaryFacts } from '../localAi';
import type { WorkoutLog } from '../types';

const mb = (bytes: number) => Math.round(bytes / 1_000_000);

export default function OfflineAi({ logs, goal, active }: { logs: WorkoutLog[]; goal: number; active: boolean }) {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof localAi.status>>>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ key: string; summary: string }>();
  const pending = useRef(false);
  const weekly = weeklySummaryFacts(logs, goal);
  const state = status?.state;
  const transferring = state === 'downloading' || state === 'pausing' || state === 'verifying';
  const canRemove = state === 'ready' || state === 'paused';

  useEffect(() => {
    if (!active) return;
    let current = true;
    const refresh = async () => {
      try {
        const update = await localAi.status();
        if (current) setStatus(update);
      } catch {
        if (current) setError('Offline AI is unavailable in this Android build.');
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, transferring || state === 'generating' ? 800 : 4_000);
    return () => { current = false; window.clearInterval(timer); };
  }, [active, state, transferring]);

  async function run(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      setStatus(await localAi.status());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not complete that action.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const start = () => void run(localAi.download);
  const remove = () => void run(async () => {
    await localAi.remove();
    setReport(undefined);
  });
  const summarize = () => void run(async () => {
    const { summary } = await localAi.summarize({ facts: weekly.facts });
    setReport({ key: weekly.key, summary });
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
          <p className="text-sm text-text-secondary">Download a model to turn your weekly stats into a short recap. Your workout data stays on this phone.</p>
        </div>
      </div>
      {status && state !== 'unsupported' && <div className="mt-4 rounded-xl border border-border-color/60 bg-background-dark p-3">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <strong>Qwen3 0.6B</strong>
          <span className="text-xs text-text-secondary">{state === 'ready' || state === 'generating' ? 'Installed' : `${mb(status.total)} MB download`}</span>
        </div>
        {(transferring || state === 'paused') && <>
          <progress className="session-progress mt-3" aria-label="AI model download" value={status.bytes} max={status.total} />
          <p className="mt-1 text-xs tabular-nums text-text-secondary" role="status">
            {state === 'verifying' ? 'Checking model file…' : state === 'pausing' ? 'Pausing…' : `${mb(status.bytes)} of ${mb(status.total)} MB${state === 'paused' ? ' · Paused' : ''}`}
          </p>
        </>}
        <div className="mt-2 flex flex-wrap gap-2">
          {(state === 'available' || state === 'paused') && <button type="button" className="panel-action panel-action-primary" disabled={busy} onClick={start}>
            {state === 'paused' ? 'Resume download' : 'Download model'}
          </button>}
          {state === 'downloading' && <button type="button" className="panel-action" disabled={busy} onClick={() => void run(localAi.pause)}>Pause download</button>}
          {(state === 'ready' || state === 'generating') && <button type="button" className="panel-action panel-action-primary disabled:opacity-50"
            disabled={busy || state === 'generating' || !weekly.thisWeek.workouts} onClick={summarize}>
            {state === 'generating' ? 'Writing summary…' : 'Summarize this week'}
          </button>}
          {canRemove && <button type="button" className="panel-action" disabled={busy} onClick={remove}>{state === 'paused' ? 'Discard download' : 'Remove model'}</button>}
        </div>
        {state === 'ready' && !weekly.thisWeek.workouts && <p className="mt-2 text-xs text-text-secondary">Log a workout this week to generate a recap.</p>}
      </div>}
      {state === 'unsupported' && <p className="mt-3 text-sm text-text-secondary">{status?.message}</p>}
      {(error || (state !== 'unsupported' && status?.message)) && <p className="mt-3 text-sm text-red-300" role="alert">{error || status?.message}</p>}
      {report?.key === weekly.key && <div className="mt-3 space-y-2 rounded-xl bg-background-dark p-3" role="status">
        <p className="text-xs font-semibold text-brand-light">AI recap · This week</p>
        <p className="whitespace-pre-wrap break-words text-sm">{report.summary}</p>
        <p className="text-xs text-text-secondary">{weekly.thisWeek.workouts} workouts · {weekly.thisWeek.sets} sets in your log</p>
      </div>}
    </section>
  );
}
