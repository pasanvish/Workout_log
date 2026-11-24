import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BodyMeasurementLog } from '../types';

interface BodyMeasurementsProps {
  logs: BodyMeasurementLog[];
  onSave: (log: Omit<BodyMeasurementLog, 'id'>) => void;
}

type MeasurementKey = keyof Omit<BodyMeasurementLog, 'id' | 'date'>;

const measurementFields: { key: MeasurementKey; label: string; unit: string }[] = [
    { key: 'weight', label: 'Weight', unit: 'kg' },
    { key: 'bodyFat', label: 'Body Fat', unit: '%' },
    { key: 'neck', label: 'Neck', unit: 'cm' },
    { key: 'shoulders', label: 'Shoulders', unit: 'cm' },
    { key: 'chest', label: 'Chest', unit: 'cm' },
    { key: 'biceps', label: 'Biceps', unit: 'cm' },
    { key: 'waist', label: 'Waist', unit: 'cm' },
    { key: 'hips', label: 'Hips', unit: 'cm' },
    { key: 'thighs', label: 'Thighs', unit: 'cm' },
    { key: 'calves', label: 'Calves', unit: 'cm' },
];


const featuredKeys: MeasurementKey[] = ['weight', 'bodyFat', 'waist'];
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const signedNumber = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, signDisplay: 'exceptZero' });
const measurementDate = (date: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date);
const shortDate = (date: string) => measurementDate(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const fullDate = (date: string) => measurementDate(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function today() {
  const now = new Date();
  const twoDigits = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`;
}

function readMeasurement(value?: string) {
  const parsed = value?.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

const BodyMeasurements: React.FC<BodyMeasurementsProps> = ({ logs, onSave }) => {
  const [formState, setFormState] = useState<Omit<BodyMeasurementLog, 'id'>>(() => ({ date: today() }));
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementKey>('weight');
  const [savedDate, setSavedDate] = useState<string>();
  const measuredValues = measurementFields.flatMap(({ key }) => {
    const value = formState[key];
    return readMeasurement(value) !== undefined ? [[key, value] as const] : [];
  });

  const metricHistory = useMemo(() => measurementFields.map(field => ({
    ...field,
    points: [...logs].reverse().flatMap(log => {
      const value = readMeasurement(log[field.key]);
      return value === undefined ? [] : [{ date: log.date, value }];
    }).sort((a, b) => measurementDate(a.date).getTime() - measurementDate(b.date).getTime()),
  })), [logs]);

  const chartable = metricHistory.filter(metric => metric.points.length > 0);
  const metric = chartable.find(item => item.key === selectedMeasurement) ?? chartable[0];
  const featured = [...metricHistory.filter(item => featuredKeys.includes(item.key)), ...chartable.filter(item => !featuredKeys.includes(item.key))];

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!measuredValues.length || !formState.date) return;
    onSave({ date: formState.date, ...Object.fromEntries(measuredValues) });
    setSavedDate(formState.date);
    setFormState({ date: today() });
  }

  function renderField({ key, label, unit }: typeof measurementFields[number]) {
    const id = `body-${key}`;
    return (
      <div key={key}>
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-text-secondary">{label}</label>
        <div className="relative">
          <input id={id} inputMode="decimal" value={formState[key] ?? ''} placeholder="–"
            onChange={event => {
              const value = event.target.value.replace(',', '.');
              if (/^\d*\.?\d*$/.test(value)) setFormState(previous => ({ ...previous, [key]: value }));
            }}
            className="track-input w-full pr-9" />
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-text-secondary">{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-tight">Body measurements</h2>
        <a href="#log-measurements" className="panel-action panel-action-primary">Log measurements</a>
      </div>

      <div className="grid grid-cols-3 gap-2.5" aria-label="Latest measurements">
        {featured.slice(0, 3).map(item => {
          const latest = item.points.at(-1);
          const previous = item.points.at(-2);
          const change = latest && previous ? Number((latest.value - previous.value).toFixed(2)) : undefined;
          return (
            <div key={item.key} className="stat-card">
              <span className="text-xs font-medium text-text-secondary">{item.label}</span>
              <strong className="mt-2 text-lg leading-tight tabular-nums text-text-primary sm:text-2xl">
                {latest ? number.format(latest.value) : '—'}
                {latest && <span className="ml-1 text-[11px] font-medium text-text-secondary">{item.unit}</span>}
              </strong>
              <span className="mt-1 text-[11px] leading-snug text-brand-light">
                {change === undefined ? (latest ? shortDate(latest.date) : 'No entries') : `${signedNumber.format(change)} ${item.unit === '%' ? 'pp' : item.unit} since last`}
              </span>
            </div>
          );
        })}
      </div>

      {metric && (
        <section className="tracking-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Measurement trend</h3>
            <select aria-label="Measurement to chart" className="track-input" value={metric.key} onChange={event => setSelectedMeasurement(event.target.value as MeasurementKey)}>
              {chartable.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </div>
          {metric.points.length > 1 ? (
            <div className="mt-3 h-52 min-w-0" aria-label={`${metric.label} over time`}>
              <ResponsiveContainer>
                <AreaChart data={metric.points} margin={{ top: 10, right: 10, left: -14, bottom: 0 }}>
                  <defs><linearGradient id="body-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#75ebc9" stopOpacity={0.27} /><stop offset="100%" stopColor="#75ebc9" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#2c3d49" strokeDasharray="3 4" />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#9cafbc', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#9cafbc', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip labelFormatter={fullDate} formatter={value => [`${value} ${metric.unit}`, metric.label]} contentStyle={{ background: '#121c24', borderColor: '#2c3d49', borderRadius: 12 }} />
                  <Area type="linear" dataKey="value" stroke="#75ebc9" fill="url(#body-fill)" strokeWidth={2.5} dot={{ r: 3, fill: '#75ebc9' }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-4 rounded-xl bg-background-dark p-3 text-sm text-text-secondary">Add a second {metric.label.toLowerCase()} entry to see a trend.</p>}
        </section>
      )}

      <form id="log-measurements" onSubmit={handleSave} className="tracking-panel scroll-mt-20 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Log measurements</h3>
            <p className="mt-1 text-sm text-text-secondary">Enter the measurements you took.</p>
          </div>
          <label className="text-xs font-medium text-text-secondary">
            <span className="sr-only">Measurement date</span>
            <input type="date" required value={formState.date} onChange={event => setFormState(previous => ({ ...previous, date: event.target.value }))} className="track-input max-w-full" />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2.5">{measurementFields.filter(field => featuredKeys.includes(field.key)).map(renderField)}</div>
        <details className="rounded-xl border border-border-color/60 bg-background-dark">
          <summary className="cursor-pointer px-3 py-2.5 text-sm text-text-primary">More measurements</summary>
          <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">{measurementFields.filter(field => !featuredKeys.includes(field.key)).map(renderField)}</div>
        </details>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="panel-action panel-action-primary disabled:opacity-40" disabled={!measuredValues.length}>Save measurements</button>
          <span role="status" className="text-sm text-brand-light">{savedDate && `Saved for ${fullDate(savedDate)}.`}</span>
        </div>
      </form>

      {logs.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Measurement history</h3>
          {logs.map(log => (
            <article key={log.id} className="tracking-panel">
              <h4 className="mb-2 text-sm font-semibold text-brand-light">{fullDate(log.date)}</h4>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {measurementFields.map(field => log[field.key] && (
                  <div key={field.key} className="rounded-lg bg-background-dark px-2.5 py-2">
                    <dt className="text-xs text-text-secondary">{field.label}</dt>
                    <dd className="text-sm font-semibold tabular-nums">{log[field.key]} {field.unit}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default BodyMeasurements;
