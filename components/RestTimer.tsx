import React, { useEffect, useState } from 'react';
import { formatDuration } from '../setTracking';

export default function RestTimer({ endsAt, onAdd, onClose }: { endsAt: number; onAdd: () => void; onClose: () => void }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000));

  return (
    <aside className="rest-timer" aria-label="Rest timer">
      <div className="min-w-0 flex-1 pl-1">
        <p className="text-xs font-semibold text-text-secondary">{seconds > 0 ? 'Rest timer' : 'Rest complete'}</p>
        <p className="text-lg font-bold tabular-nums text-brand-light" role="timer">{formatDuration(seconds)}</p>
      </div>
      <button type="button" onClick={onAdd} className="panel-action">+15 sec</button>
      <button type="button" onClick={onClose} className="panel-action">{seconds > 0 ? 'Skip' : 'Done'}</button>
    </aside>
  );
}
