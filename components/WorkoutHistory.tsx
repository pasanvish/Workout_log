import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WorkoutLog } from '../types';

interface WorkoutHistoryProps {
  logs: WorkoutLog[];
  onImportLogs: (logs: WorkoutLog[]) => void;
  onExportLogs: () => void;
  onClose: () => void;
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

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ logs, onImportLogs, onExportLogs, onClose }) => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedRoutineFilter, setSelectedRoutineFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Automatically expand the first (most recent) log when the component loads
    if (logs.length > 0) {
      setExpandedLogs(new Set([logs[0].id]));
    }
  }, [logs]);

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
    if (selectedRoutineFilter === 'all') return logs;
    return logs.filter(log => log.routineName === selectedRoutineFilter);
  }, [logs, selectedRoutineFilter]);

  const chartData = useMemo(() => {
    if (!selectedExercise) return [];
    const data: { date: string; maxWeight: number }[] = [];
    const relevantLogs = [...logs].reverse().filter(log => log.exercises.some(ex => ex.name === selectedExercise));
    relevantLogs.forEach(log => {
        const exercise = log.exercises.find(ex => ex.name === selectedExercise);
        if (exercise) {
            const maxWeight = Math.max(...exercise.sets.map(set => parseFloat(set.weight) || 0));
            if (maxWeight > 0) {
                data.push({
                    date: new Date(log.date).toLocaleDateString(),
                    maxWeight: maxWeight
                });
            }
        }
    });
    return data;
  }, [logs, selectedExercise]);

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text === 'string') {
                  const jsonData = JSON.parse(text);
                  onImportLogs(jsonData);
              }
          } catch (error) {
              alert("Error reading or parsing file. Please make sure it's a valid JSON file.");
              console.error("Import error:", error);
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };
  
  if (logs.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-border-color flex-shrink-0">
            <h2 id="history-drawer-title" className="text-xl font-bold text-text-primary">Workout History</h2>
            <button onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-card-dark hover:text-text-primary transition-colors" aria-label="Close history">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div className="flex-grow flex items-center justify-center text-center p-6">
            <div>
              <NoDataIcon />
              <h2 className="text-2xl font-bold text-text-primary mt-4 mb-2">No Workouts Logged Yet</h2>
              <p className="text-text-secondary mb-6">Start by logging a workout or import your existing data.</p>
              <div>
                  <button onClick={handleImportClick} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-brand-primary text-white hover:bg-brand-secondary transition-colors shadow-md">
                      <UploadIcon/>
                      Import Existing Data
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
              </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light">
      <div className="flex justify-between items-center p-4 border-b border-border-color flex-shrink-0 bg-background-light sticky top-0 z-10">
          <h2 id="history-drawer-title" className="text-xl font-bold text-text-primary">Workout History</h2>
          <button onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-card-dark hover:text-text-primary transition-colors" aria-label="Close history">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
      </div>

      <div className="overflow-y-auto p-4 md:p-6 space-y-8">
        {uniqueExercises.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-center text-text-primary mb-2">Progress Tracker</h3>
            <p className="text-center text-text-secondary mb-6">Select an exercise to visualize your strength gains over time.</p>
            <div className="bg-background-dark/50 p-6 rounded-xl shadow-xl">
              <label htmlFor="exercise-select" className="block text-sm font-medium text-text-secondary mb-2">Select an exercise:</label>
              <select
                id="exercise-select"
                value={selectedExercise || ''}
                onChange={(e) => setSelectedExercise(e.target.value || null)}
                className="w-full bg-card-dark border border-border-color text-text-primary rounded-lg focus:ring-brand-primary focus:border-brand-primary p-2.5"
              >
                <option value="">-- Select Exercise --</option>
                {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>

              {selectedExercise && chartData.length > 1 && (
                <div className="mt-6" style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} label={{ value: 'Max Weight (kg)', angle: -90, position: 'insideLeft', fill: '#9ca3af', dy: -10 }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '0.5rem' }}
                              labelStyle={{ color: '#f9fafb' }}
                            />
                            <Legend wrapperStyle={{ color: '#f9fafb' }} />
                            <Line type="monotone" dataKey="maxWeight" name={`Max Weight`} stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
              )}
              {selectedExercise && chartData.length <= 1 && (
                 <div className="text-center text-text-secondary mt-10 p-4 bg-card-dark rounded-md">
                   <p>Log this exercise at least twice to see your progress chart.</p>
                 </div>
              )}
              {!selectedExercise && (
                   <div className="text-center text-text-secondary mt-10 p-4 bg-card-dark rounded-md">
                      <p>Select an exercise from the dropdown to view your progress.</p>
                  </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-2xl font-bold text-center text-text-primary mt-8 mb-2">Session Logs</h3>
           <div className="flex flex-col md:flex-row gap-4 items-center mb-6 bg-background-dark/50 p-4 rounded-xl">
            <select
              onChange={(e) => setSelectedRoutineFilter(e.target.value)}
              value={selectedRoutineFilter}
              className="w-full md:w-auto bg-card-dark border border-border-color text-text-primary rounded-lg focus:ring-brand-primary focus:border-brand-primary p-2.5"
            >
              <option value="all">All Routines</option>
              {uniqueRoutines.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <div className="flex gap-2 ml-auto">
                <button onClick={onExportLogs} className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-card-dark text-text-secondary hover:bg-gray-600 transition-colors">
                    <DownloadIcon/>
                    Export
                </button>
                <button onClick={handleImportClick} className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-card-dark text-text-secondary hover:bg-gray-600 transition-colors">
                    <UploadIcon/>
                    Import
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>
          </div>
          <div className="space-y-4">
            {filteredLogs.map(log => {
              const isExpanded = expandedLogs.has(log.id);
              return (
              <div key={log.id} className="bg-card-dark/50 rounded-xl shadow-lg border border-border-color/50 overflow-hidden transition-all duration-300">
                <div 
                  onClick={() => toggleLogExpansion(log.id)}
                  className="flex justify-between items-center p-5 cursor-pointer hover:bg-background-dark/40"
                  aria-expanded={isExpanded}
                  aria-controls={`log-content-${log.id}`}
                  >
                  <div>
                      <h3 className="font-bold text-xl text-brand-light">{log.routineName}</h3>
                      <span className="text-sm text-text-secondary">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-xs font-mono bg-background-dark text-text-secondary px-2 py-1 rounded-full">
                      {log.exercises.length} {log.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                    </div>
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-text-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div 
                    id={`log-content-${log.id}`}
                    className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                    <div className="overflow-hidden">
                        <div className="p-5 pt-0 space-y-4 border-t border-border-color/30">
                          {log.exercises.map((exercise, index) => (
                            <div key={index} className="bg-background-dark/50 p-3 rounded-md">
                              <p className="font-semibold text-text-primary mb-2">{exercise.name}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
                                {exercise.sets.map((set, setIndex) => (
                                  <div key={setIndex} className="flex items-baseline gap-2 bg-background-light p-2 rounded-md">
                                      <span className="font-mono text-xs text-text-secondary font-bold">SET {setIndex+1}</span>
                                      <div className="flex-grow text-right">
                                          <span className="font-semibold text-text-primary">{set.weight}</span>
                                          <span className="text-xs text-text-secondary ml-1">kg</span>
                                          <span className="text-text-secondary mx-1">x</span>
                                          <span className="font-semibold text-text-primary">{set.reps}</span>
                                          <span className="text-xs text-text-secondary ml-1">reps</span>
                                      </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                    </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutHistory;