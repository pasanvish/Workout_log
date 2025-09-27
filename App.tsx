import React, { useState, useEffect, useCallback } from 'react';
import WorkoutLogger from './components/WorkoutLogger';
import HistoryDrawer from './components/HistoryDrawer';
import { WorkoutLog } from './types';

const App: React.FC = () => {
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('workoutLogs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        if (Array.isArray(parsedLogs)) {
            const sortedLogs = parsedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setWorkoutLogs(sortedLogs);
        }
      }
    } catch (error)
 {
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
    setIsHistoryDrawerOpen(true);
  }, []);

  const handleImportLogs = useCallback((importedLogs: WorkoutLog[]) => {
    if (Array.isArray(importedLogs) && (importedLogs.length === 0 || (importedLogs[0].id && importedLogs[0].date))) {
      const sortedLogs = importedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWorkoutLogs(sortedLogs);
      alert(`${importedLogs.length} workout logs imported successfully!`);
      setIsHistoryDrawerOpen(true);
    } else {
      alert('Import failed. The selected file is not valid workout log data.');
    }
  }, []);


  return (
    <div className="min-h-screen bg-background-dark font-sans">
      <header className="bg-background-light/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg border-b border-border-color/50">
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
          <div>
            <button
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-card-dark hover:bg-gray-600 text-text-primary transition-all duration-300 transform hover:scale-105 shadow-md"
              aria-label="View workout history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4a1 1 0 00-1 1v1a1 1 0 002 0V5a1 1 0 00-1-1zM16 4a1 1 0 00-1 1v1a1 1 0 002 0V5a1 1 0 00-1-1z" /><path fillRule="evenodd" d="M5.5 9.5A1.5 1.5 0 017 8h6a1.5 1.5 0 011.5 1.5v5A1.5 1.5 0 0113 16H7a1.5 1.5 0 01-1.5-1.5v-5zM7 9h6v5H7V9z" clipRule="evenodd" /></svg>
              <span>History</span>
            </button>
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-4 md:p-6">
        <WorkoutLogger onSave={addWorkoutLog} />
      </main>
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        logs={workoutLogs}
        onImportLogs={handleImportLogs}
      />
    </div>
  );
};

export default App;