import React, { useState, useEffect, useCallback, useMemo } from 'react';
import WorkoutLogger from './components/WorkoutLogger';
import HistoryDrawer from './components/HistoryDrawer';
import ProfileManager from './components/ProfileManager';
import PRNotificationModal from './components/PRNotificationModal';
import { WorkoutLog, Profile, CustomRoutine, CustomExercise, AllPRs, BodyMeasurementLog } from './types';
import BodyMeasurements from './components/BodyMeasurements';

const App: React.FC = () => {
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  
  // App-wide state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<Record<string, WorkoutLog[]>>({});
  const [customRoutines, setCustomRoutines] = useState<Record<string, CustomRoutine[]>>({});
  const [customExercises, setCustomExercises] = useState<Record<string, CustomExercise[]>>({});
  const [personalRecords, setPersonalRecords] = useState<AllPRs>({});
  const [bodyMeasurements, setBodyMeasurements] = useState<Record<string, BodyMeasurementLog[]>>({});
  
  const [newlySetPRs, setNewlySetPRs] = useState<Array<{exerciseName: string; weight: string; reps: string}>>([]);
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'logger' | 'measurements'>('logger');


  useEffect(() => {
    try {
      const savedProfiles = JSON.parse(localStorage.getItem('profiles') || '[]');
      const savedActiveProfileId = JSON.parse(localStorage.getItem('activeProfileId') || 'null');
      const savedWorkoutLogs = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
      const savedCustomRoutines = JSON.parse(localStorage.getItem('customRoutines') || '{}');
      const savedCustomExercises = JSON.parse(localStorage.getItem('customExercises') || '{}');
      const savedPersonalRecords = JSON.parse(localStorage.getItem('personalRecords') || '{}');
      const savedBodyMeasurements = JSON.parse(localStorage.getItem('bodyMeasurements') || '{}');

      setProfiles(savedProfiles);
      setActiveProfileId(savedActiveProfileId);
      setWorkoutLogs(savedWorkoutLogs);
      setCustomRoutines(savedCustomRoutines);
      setCustomExercises(savedCustomExercises);
      setPersonalRecords(savedPersonalRecords);
      setBodyMeasurements(savedBodyMeasurements);
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    } finally {
      setIsAppReady(true);
    }
  }, []);

  useEffect(() => {
    if(!isAppReady) return;
    try {
      localStorage.setItem('profiles', JSON.stringify(profiles));
      localStorage.setItem('activeProfileId', JSON.stringify(activeProfileId));
      localStorage.setItem('workoutLogs', JSON.stringify(workoutLogs));
      localStorage.setItem('customRoutines', JSON.stringify(customRoutines));
      localStorage.setItem('customExercises', JSON.stringify(customExercises));
      localStorage.setItem('personalRecords', JSON.stringify(personalRecords));
      localStorage.setItem('bodyMeasurements', JSON.stringify(bodyMeasurements));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [profiles, activeProfileId, workoutLogs, customRoutines, customExercises, personalRecords, bodyMeasurements, isAppReady]);

  const activeProfile = useMemo(() => profiles.find(p => p.id === activeProfileId), [profiles, activeProfileId]);
  const activeLogs = useMemo(() => (activeProfileId && workoutLogs[activeProfileId]) || [], [workoutLogs, activeProfileId]);
  const activeRoutines = useMemo(() => (activeProfileId && customRoutines[activeProfileId]) || [], [customRoutines, activeProfileId]);
  const activeCustomExercises = useMemo(() => (activeProfileId && customExercises[activeProfileId]) || [], [customExercises, activeProfileId]);
  const activePRs = useMemo(() => (activeProfileId && personalRecords[activeProfileId]) || {}, [personalRecords, activeProfileId]);
  const activeBodyMeasurements = useMemo(() => (activeProfileId && bodyMeasurements[activeProfileId]) || [], [bodyMeasurements, activeProfileId]);
  
  const addWorkoutLog = useCallback((log: WorkoutLog) => {
    if (!activeProfileId) return;

    const currentPRs = personalRecords[activeProfileId] || {};
    const updatedPRs = JSON.parse(JSON.stringify(currentPRs)); // Deep copy
    const newPRsThisSession: Array<{ exerciseName: string; weight: string; reps: string }> = [];
    let prsUpdated = false;

    const logWithPRs: WorkoutLog = {
      ...log,
      exercises: log.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(set => {
          const weight = parseFloat(set.weight);
          const reps = parseInt(set.reps, 10);

          if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
            const existingPRWeight = updatedPRs[ex.name]?.[reps]?.weight || 0;
            if (weight > existingPRWeight) {
              if (!updatedPRs[ex.name]) {
                updatedPRs[ex.name] = {};
              }
              updatedPRs[ex.name][reps] = { weight, date: log.date };
              newPRsThisSession.push({ exerciseName: ex.name, ...set });
              prsUpdated = true;
              return { ...set, isPR: true };
            }
          }
          return { ...set, isPR: false };
        })
      }))
    };
    
    if (prsUpdated) {
      setPersonalRecords(prev => ({ ...prev, [activeProfileId]: updatedPRs }));
    }

    const newLogs = [logWithPRs, ...(workoutLogs[activeProfileId] || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setWorkoutLogs(prev => ({ ...prev, [activeProfileId]: newLogs }));
    
    if (newPRsThisSession.length > 0) {
      setNewlySetPRs(newPRsThisSession);
    }

    setIsHistoryDrawerOpen(true);
  }, [activeProfileId, workoutLogs, personalRecords]);

  const addBodyMeasurement = useCallback((log: Omit<BodyMeasurementLog, 'id'>) => {
    if (!activeProfileId) return;
    const newLog = { ...log, id: new Date().toISOString() };
    const newLogs = [newLog, ...(bodyMeasurements[activeProfileId] || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBodyMeasurements(prev => ({ ...prev, [activeProfileId]: newLogs }));
  }, [activeProfileId, bodyMeasurements]);

  const handleImportLogs = useCallback((importedLogs: WorkoutLog[]) => {
    if (!activeProfileId) return;
    if (Array.isArray(importedLogs) && (importedLogs.length === 0 || (importedLogs[0].id && importedLogs[0].date))) {
      const sortedLogs = importedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWorkoutLogs(prev => ({...prev, [activeProfileId]: sortedLogs}));
      alert(`${importedLogs.length} workout logs imported successfully for ${activeProfile?.name}! This will not recalculate PRs.`);
      setIsHistoryDrawerOpen(true);
    } else {
      alert('Import failed. The selected file is not valid workout log data.');
    }
  }, [activeProfileId, activeProfile?.name]);

  const handleExportLogs = useCallback(() => {
    if (!activeProfileId || !activeProfile || activeLogs.length === 0) {
        alert("No data to export for the current profile.");
        return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(activeLogs, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    const profileName = activeProfile.name.replace(/\s/g, '_');
    link.download = `gym-logs-${profileName}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    link.remove();
  }, [activeProfileId, activeProfile, activeLogs]);

  const addProfile = (name: string) => {
    const newProfile: Profile = { id: Date.now().toString(), name };
    setProfiles(p => [...p, newProfile]);
    setActiveProfileId(newProfile.id);
  };

  const switchProfile = (id: string) => {
    setActiveProfileId(id);
  }

  const addRoutine = (routine: Omit<CustomRoutine, 'id'>) => {
    if(!activeProfileId) return;
    const newRoutine = { ...routine, id: Date.now().toString() };
    const newRoutines = [...(customRoutines[activeProfileId] || []), newRoutine];
    setCustomRoutines(prev => ({...prev, [activeProfileId]: newRoutines}));
    return newRoutine;
  };
  
  const addCustomExercise = (exercise: Omit<CustomExercise, 'id'>) => {
    if(!activeProfileId) return;
    const newExercise = { ...exercise, id: Date.now().toString() };
    const newExercises = [...(customExercises[activeProfileId] || []), newExercise];
    setCustomExercises(prev => ({...prev, [activeProfileId]: newExercises}));
    return newExercise;
  };

  if (!isAppReady) {
    return <div className="min-h-screen bg-background-dark flex items-center justify-center"><p>Loading...</p></div>
  }

  if (!activeProfileId || !activeProfile) {
    return <ProfileManager profiles={profiles} onAddProfile={addProfile} onSelectProfile={switchProfile} />;
  }

  return (
    <div className="min-h-screen bg-background-dark font-sans">
      <header className="bg-background-light/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg border-b border-border-color/50">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <div className="bg-brand-primary p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 13a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /><path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v1.333a1 1 0 00.707.943l2 1A1 1 0 0013 7.667V6a1 1 0 00-1-1h-2zm-2 4.667V11a1 1 0 001 1h2a1 1 0 001-1V7.667a1 1 0 00-.293-.707l-2-2A1 1 0 009.414 5H8a1 1 0 00-1 1v1.667zM3 10a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1zm13 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-wider">{activeProfile.name}'s Log</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
                onClick={() => setActiveProfileId(null)}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Switch profile"
            >
                Switch Profile
            </button>
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
        <div className="max-w-4xl mx-auto mb-6">
            <div className="flex border-b border-border-color">
            <button
                onClick={() => setActiveTab('logger')}
                className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors w-1/2 ${activeTab === 'logger' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
                Workouts
            </button>
            <button
                onClick={() => setActiveTab('measurements')}
                className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors w-1/2 ${activeTab === 'measurements' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
                Measurements
            </button>
            </div>
        </div>
        <div key={activeTab} className="animate-fade-in-up">
            {activeTab === 'logger' && (
                <WorkoutLogger 
                    onSave={addWorkoutLog} 
                    routines={activeRoutines}
                    onAddRoutine={addRoutine}
                    logs={activeLogs}
                    customExercises={activeCustomExercises}
                    onAddCustomExercise={addCustomExercise}
                />
            )}
            {activeTab === 'measurements' && (
                <BodyMeasurements 
                    logs={activeBodyMeasurements}
                    onSave={addBodyMeasurement}
                />
            )}
        </div>
      </main>
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        logs={activeLogs}
        onImportLogs={handleImportLogs}
        onExportLogs={handleExportLogs}
        activeProfile={activeProfile}
        personalRecords={activePRs}
      />
      <PRNotificationModal
        isOpen={newlySetPRs.length > 0}
        onClose={() => setNewlySetPRs([])}
        prs={newlySetPRs}
      />
    </div>
  );
};

export default App;
