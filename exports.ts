import { Capacitor, registerPlugin } from '@capacitor/core';
import { formatSet, isCompleteSet, trackingOf } from './setTracking.ts';
import type { WorkoutLog } from './types';

interface ExportFile {
  filename: string;
  mimeType: 'application/json' | 'text/html';
  content: string;
}

const FileExport = registerPlugin<{ save(options: ExportFile): Promise<{ saved: boolean }> }>('FileExport');

export async function saveExport(file: ExportFile): Promise<boolean> {
  if (Capacitor.getPlatform() === 'android') return (await FileExport.save(file)).saved;

  const url = URL.createObjectURL(new Blob([file.content], { type: file.mimeType + ';charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  try {
    link.click();
    return true;
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

export function exportName(prefix: string, profileName: string, extension: string) {
  const name = profileName.trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 50) || 'profile';
  return `${prefix}-${name}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value: string) => String(value).replace(/[&<>"']/g, character => entities[character]);

export function workoutReport(profileName: string, logs: WorkoutLog[]) {
  const title = `Workout history for ${escape(profileName)}`;
  const sessions = logs.map(log => {
    const date = new Date(log.date).toLocaleDateString(undefined, { dateStyle: 'long' });
    const effort = Number.isInteger(log.effort) && log.effort >= 1 && log.effort <= 5 ? ` · Effort ${log.effort}/5` : '';
    const exercises = log.exercises.map(exercise => {
      const mode = trackingOf(exercise);
      const sets = exercise.sets.filter(set => isCompleteSet(set, mode)).map(set =>
        `<li>${escape(formatSet(set, mode))} ${set.isPR ? '<strong>PR</strong>' : ''}</li>`,
      ).join('');
      return `<h3>${escape(exercise.name)}</h3><ul>${sets}</ul>`;
    }).join('');
    return `<article><h2>${escape(log.routineName)}</h2><p>${escape(date)}${effort}</p>${exercises}</article>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
body{margin:2rem auto;padding:0 1rem;max-width:44rem;font:1rem/1.5 system-ui,sans-serif;color:#15262b}
h1,h2,h3{line-height:1.2;color:#075e51}h2,h3,p{margin:0 0 .5rem}
article{border:1px solid #ccd7d7;border-radius:12px;padding:1rem 1.25rem;margin:1rem 0;break-inside:avoid}
ul{padding-left:1.3rem}li{margin:.25rem 0}
</style></head>
<body><h1>${title}</h1><p>${logs.length} ${logs.length === 1 ? 'session' : 'sessions'}</p>${sessions}</body>
</html>`;
}
