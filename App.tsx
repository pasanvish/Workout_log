import React, { useState, useEffect, useCallback } from 'react';
import WorkoutLogger from './components/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory';
import { WorkoutLog } from './types';

type View = 'logger' | 'history';

const App: React.FC = () => {
  const [view, setView] = useState<View>('logger');
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('workoutLogs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        if (Array.isArray(parsedLogs)) {
            const sortedLogs = parsedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setWorkoutLogs(sortedLogs);
            if (sortedLogs.length > 0) {
              setView('history');
            }
        }
      }
    } catch (error) {
      console.error("Failed to load workout logs from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('workoutLogs', JSON.stringify(workoutLogs));
    } catch (error) {
      console.error("Failed to save workout logs to localStorage", error);
    }
  }, [workoutLogs]);

  const addWorkoutLog = useCallback((log: WorkoutLog) => {
    setWorkoutLogs(prevLogs => [log, ...prevLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setView('history');
  }, []);

  const handleImportLogs = useCallback((importedLogs: WorkoutLog[]) => {
    if (Array.isArray(importedLogs) && (importedLogs.length === 0 || (importedLogs[0].id && importedLogs[0].date))) {
      const sortedLogs = importedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWorkoutLogs(sortedLogs);
      alert(`${importedLogs.length} workout logs imported successfully!`);
      setView('history');
    } else {
      alert('Import failed. The selected file is not valid workout log data.');
    }
  }, []);


  return (
    <div className="min-h-screen bg-background-dark font-sans">
      <header className="bg-background-light sticky top-0 z-10 shadow-lg">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <div className="bg-brand-primary p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 13a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                    <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v1.333a1 1 0 00.707.943l2 1A1 1 0 0013 7.667V6a1 1 0 00-1-1h-2zm-2 4.667V11a1 1 0 001 1h2a1 1 0 001-1V7.667a1 1 0 00-.293-.707l-2-2A1 1 0 009.414 5H8a1 1 0 00-1 1v1.667zM3 10a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1zm13 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-wider">Gym Logger</h1>
          </div>
          <div className="flex space-x-1 bg-card-dark p-1 rounded-lg">
            <button
              onClick={() => setView('logger')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                view === 'logger' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary hover:bg-background-light'
              }`}
            >
              Log Workout
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                view === 'history' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary hover:bg-background-light'
              }`}
            >
              View History
            </button>
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-4 md:p-6">
        {view === 'logger' && <WorkoutLogger onSave={addWorkoutLog} />}
        {view === 'history' && <WorkoutHistory logs={workoutLogs} onImportLogs={handleImportLogs} />}
      </main>
    </div>
  );
};

export default App;