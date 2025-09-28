import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BodyMeasurementLog } from '../types';

interface BodyMeasurementsProps {
  logs: BodyMeasurementLog[];
  onSave: (log: Omit<BodyMeasurementLog, 'id'>) => void;
}

const initialFormState: Omit<BodyMeasurementLog, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  weight: '', bodyFat: '', neck: '', shoulders: '', chest: '',
  biceps: '', waist: '', hips: '', thighs: '', calves: '',
};

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


const BodyMeasurements: React.FC<BodyMeasurementsProps> = ({ logs, onSave }) => {
  const [formState, setFormState] = useState(initialFormState);
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementKey>('weight');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(value)) {
        setFormState(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({...prev, date: e.target.value}));
  }

  const handleSave = () => {
    const measurementsToSave = Object.fromEntries(
        // FIX: Add a `typeof value === 'string'` check to ensure `value.trim()` is only called on strings.
        Object.entries(formState).filter(([key, value]) => key !== 'date' && typeof value === 'string' && value.trim() !== '')
    );

    if (Object.keys(measurementsToSave).length === 0) {
      alert('Please enter at least one measurement to save.');
      return;
    }
    
    onSave({
      date: formState.date || new Date().toISOString(),
      ...measurementsToSave
    });
    setFormState(initialFormState);
  };
  
  const isSaveDisabled = useMemo(() => {
    // FIX: Add a `typeof value === 'string'` check to safely call `value.trim()`.
    return Object.entries(formState).every(([key, value]) => key === 'date' || !value || (typeof value === 'string' && value.trim() === ''));
  }, [formState]);

  const chartableMeasurements = useMemo(() => {
    const measuredKeys = new Set<MeasurementKey>();
    logs.forEach(log => {
        // FIX: The cast was too restrictive. `Object.keys(log)` includes 'id' and 'date'.
        // Casting to `keyof BodyMeasurementLog` allows the type checker to correctly
        // infer the type of `key` after the conditional check.
        (Object.keys(log) as (keyof BodyMeasurementLog)[]).forEach(key => {
            if (key !== 'id' && key !== 'date' && log[key]) {
                // FIX: Add a type assertion because TypeScript may not correctly narrow
                // the type of 'key' within the forEach callback, causing a type error.
                measuredKeys.add(key as MeasurementKey);
            }
        });
    });
    return measurementFields.filter(field => measuredKeys.has(field.key));
  }, [logs]);

  const chartData = useMemo(() => {
    if (!selectedMeasurement) return [];
    
    const data = [...logs]
        .filter(log => log[selectedMeasurement] && !isNaN(parseFloat(log[selectedMeasurement]!)))
        .map(log => ({
            date: new Date(log.date).toLocaleDateString(),
            value: parseFloat(log[selectedMeasurement]!),
        }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return data;
  }, [logs, selectedMeasurement]);
  
  const selectedMeasurementInfo = measurementFields.find(f => f.key === selectedMeasurement);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-background-light p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-text-primary mb-1">Log New Measurements</h2>
        <p className="text-text-secondary mb-4 text-sm">Fill in any measurements you've taken. You don't need to fill them all out every time.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
                <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    value={formState.date}
                    onChange={handleDateChange}
                    className="w-full bg-background-dark border-2 border-border-color rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary transition-colors"
                />
            </div>
          {measurementFields.map(({ key, label, unit }) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  id={key}
                  name={key}
                  value={formState[key]}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full bg-background-dark border-2 border-border-color rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary transition-colors pr-12"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary text-sm">{unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="w-full mt-6 bg-gradient-to-r from-brand-primary to-cyan-500 hover:from-brand-secondary hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Measurements
        </button>
      </div>

      <div className="bg-background-light p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-text-primary mb-4 text-center">Progress & History</h2>

        {logs.length > 0 ? (
          <>
            <div className="bg-background-dark/50 p-6 rounded-xl shadow-inner">
                <label htmlFor="measurement-select" className="block text-sm font-medium text-text-secondary mb-2">Select a measurement to track:</label>
                <select
                    id="measurement-select"
                    value={selectedMeasurement}
                    onChange={(e) => setSelectedMeasurement(e.target.value as MeasurementKey)}
                    className="w-full bg-card-dark border border-border-color text-text-primary rounded-lg focus:ring-brand-primary focus:border-brand-primary p-2.5"
                >
                    {chartableMeasurements.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
                </select>

                {chartData.length > 1 ? (
                    <div className="mt-6" style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} label={{ value: selectedMeasurementInfo?.unit, angle: -90, position: 'insideLeft', fill: '#9ca3af', dy: 40 }}/>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#f9fafb' }}
                        />
                        <Line type="monotone" dataKey="value" name={selectedMeasurementInfo?.label} stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center text-text-secondary mt-10 p-4 bg-card-dark rounded-md">
                        <p>Log this measurement at least twice to see your progress chart.</p>
                    </div>
                )}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-text-primary mb-3">Measurement History</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {logs.map(log => (
                  <div key={log.id} className="bg-card-dark p-4 rounded-lg">
                    <p className="font-bold text-brand-light mb-2">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {measurementFields.map(field => log[field.key] && (
                        <div key={field.key}>
                            <span className="text-text-secondary">{field.label}: </span>
                            <span className="font-semibold text-text-primary">{log[field.key]} {field.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-text-secondary py-10">
            <p>No body measurements logged yet.</p>
            <p>Use the form above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BodyMeasurements;
