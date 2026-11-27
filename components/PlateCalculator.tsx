import React, { useMemo, useState } from 'react';
import ModalFrame from './ModalFrame';
import { MAX_BAR_LOAD, plateLoading, PLATE_SIZES } from '../plateLoading';
import { cleanSetInput } from '../setTracking';

interface PlateCalculatorProps {
  initialWeight: string;
  onClose: () => void;
}

const defaultPlates = [20, 15, 10, 5, 2.5, 1.25];

export default function PlateCalculator({ initialWeight, onClose }: PlateCalculatorProps) {
  const [target, setTarget] = useState(initialWeight);
  const [bar, setBar] = useState('20');
  const [plates, setPlates] = useState(defaultPlates);
  const result = useMemo(() => target && bar ? plateLoading(Number(target), Number(bar), plates) : undefined, [bar, plates, target]);

  return (
    <ModalFrame title="Plate calculator" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-semibold text-text-secondary">
            Total weight (kg)
            <input className="track-input mt-1.5 w-full" inputMode="decimal" value={target} onChange={event => setTarget(cleanSetInput('weight', event.target.value))} />
          </label>
          <label className="block text-xs font-semibold text-text-secondary">
            Bar weight (kg)
            <input className="track-input mt-1.5 w-full" inputMode="decimal" value={bar} onChange={event => setBar(cleanSetInput('weight', event.target.value))} />
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-text-secondary">Available plate sizes (kg)</legend>
          <div className="flex flex-wrap gap-1.5">
            {PLATE_SIZES.map(weight => (
              <button key={weight} type="button" className="category-chip" aria-pressed={plates.includes(weight)}
                onClick={() => setPlates(current => current.includes(weight) ? current.filter(value => value !== weight) : [...current, weight])}>
                {weight}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="rounded-xl border border-border-color bg-background-dark p-4" aria-live="polite">
          {result ? <>
            <p className="text-xs font-semibold text-text-secondary">{result.exact ? 'Total load' : 'Closest load below target'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-brand-light">{result.total} kg</p>
            {result.perSide.length ? <p className="mt-2 text-sm">Each side · {result.perSide.map(({ weight, count }) => `${count} × ${weight} kg`).join(' + ')}</p> :
              <p className="mt-2 text-sm">Bar only</p>}
          </> : <p className="text-sm text-text-secondary">
            {Number(target) > MAX_BAR_LOAD ? `Enter up to ${MAX_BAR_LOAD} kg.` : 'Enter a total weight at least as heavy as the bar.'}
          </p>}
        </div>
      </div>
    </ModalFrame>
  );
}
