import React, { useState, useEffect, useCallback, useMemo } from 'react';
import WorkoutLogger from './components/WorkoutLogger';
import HistoryDrawer from './components/HistoryDrawer';
import ProfileManager from './components/ProfileManager';
import PRNotificationModal from './components/PRNotificationModal';
import { WorkoutLog, Profile, CustomRoutine, CustomExercise, AllPRs, BodyMeasurementLog } from './types';
import BodyMeasurements from './components/BodyMeasurements';
import { Capacitor } from '@capacitor/core';

const ANDROID_APK_URL = 'https://github.com/pasanvish/Workout_log/releases/latest/download/GymLogger.apk';
import { recomputePRs, parseBackup, mergeById, sortByDateDesc, Backup } from './data';

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
  const [showAndroidBanner, setShowAndroidBanner] = useState(() => {
    try {
      return /Android/i.test(navigator.userAgent) && !Capacitor.isNativePlatform() && !localStorage.getItem('hideAndroidBanner');
    } catch { return false; }
  });
  const dismissAndroidBanner = () => {
    setShowAndroidBanner(false);
    try { localStorage.setItem('hideAndroidBanner', '1'); } catch { /* ignore */ }
  };


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

  const replaceLogs = useCallback((profileId: string, logs: WorkoutLog[]) => {
    const { logs: flagged, prs } = recomputePRs(logs);
    setWorkoutLogs(prev => ({ ...prev, [profileId]: flagged }));
    setPersonalRecords(prev => ({ ...prev, [profileId]: prs }));
  }, []);

  const deleteWorkoutLog = useCallback((logId: string) => {
    if (!activeProfileId) return;
    replaceLogs(activeProfileId, activeLogs.filter(l => l.id !== logId));
  }, [activeProfileId, activeLogs, replaceLogs]);

  const updateWorkoutLog = useCallback((log: WorkoutLog) => {
    if (!activeProfileId) return;
    replaceLogs(activeProfileId, activeLogs.map(l => l.id === log.id ? log : l));
  }, [activeProfileId, activeLogs, replaceLogs]);

  const handleImportLogs = useCallback((data: unknown) => {
    if (!activeProfileId) return;
    const backup = parseBackup(data);
    if (!backup) {
      alert('Import failed. The selected file is not a valid Gym Logger backup.');
      return;
    }
    const logs = mergeById(activeLogs, backup.workoutLogs);
    const added = logs.length - activeLogs.length;
    replaceLogs(activeProfileId, logs);
    setCustomRoutines(prev => ({ ...prev, [activeProfileId]: mergeById(prev[activeProfileId] || [], backup.customRoutines) }));
    setCustomExercises(prev => ({ ...prev, [activeProfileId]: mergeById(prev[activeProfileId] || [], backup.customExercises) }));
    setBodyMeasurements(prev => ({ ...prev, [activeProfileId]: sortByDateDesc(mergeById(prev[activeProfileId] || [], backup.bodyMeasurements)) }));
    alert(`Import complete for ${activeProfile?.name}: ${added} new workout${added === 1 ? '' : 's'} added. Nothing already on this device was overwritten.`);
    setIsHistoryDrawerOpen(true);
  }, [activeProfileId, activeProfile?.name, activeLogs, replaceLogs]);

  const handleExportLogs = useCallback(() => {
    if (!activeProfile) return;
    const backup: Backup = {
      app: 'gym-weight-logger',
      version: 2,
      exportedAt: new Date().toISOString(),
      profileName: activeProfile.name,
      workoutLogs: activeLogs,
      customRoutines: activeRoutines,
      customExercises: activeCustomExercises,
      bodyMeasurements: activeBodyMeasurements,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `gym-backup-${activeProfile.name.replace(/\s/g, '_')}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activeProfile, activeLogs, activeRoutines, activeCustomExercises, activeBodyMeasurements]);

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

  const tabs = [
    { id: 'logger' as const, label: 'Workout', icon: 'M4 10h2m12 0h2M6 7v6m12-6v6M8 8.5v3m8-3v3M8 10h8' },
    { id: 'measurements' as const, label: 'Body', icon: 'M4 19h16M6 15l3-4 3 2 3-5 3 3' },
  ];

  return (
    <div className="min-h-screen bg-background-dark font-sans">
      <header className="bg-background-light/90 backdrop-blur-sm sticky top-0 z-20 border-b border-border-color/50 pt-[env(safe-area-inset-top)]">
        <nav className="container mx-auto px-4 md:px-6 h-14 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src="./icon.svg" alt="" className="h-9 w-9 rounded-lg shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-primary">Gym Logger</p>
              <h1 className="text-base font-bold text-text-primary truncate">{activeProfile.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveProfileId(null)}
              className="h-10 px-3 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-card-dark transition-colors"
            >
              Switch
            </button>
            <button
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="hidden md:flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-card-dark hover:bg-gray-600 text-text-primary transition-colors"
            >
              History
            </button>
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-4 md:p-6 pb-28 md:pb-6">
        {showAndroidBanner && (
          <div className="max-w-4xl mx-auto mb-4 flex items-center gap-3 rounded-xl border border-brand-primary/40 bg-brand-primary/10 p-3">
            <p className="flex-1 text-sm text-text-primary">Get the Android app for the full-screen experience.</p>
            <a href={ANDROID_APK_URL} className="shrink-0 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:bg-brand-secondary">Download</a>
            <button onClick={dismissAndroidBanner} className="shrink-0 h-9 w-9 rounded-lg text-text-secondary hover:text-text-primary" aria-label="Dismiss">✕</button>
          </div>
        )}
        <div className="hidden md:block max-w-4xl mx-auto mb-6">
            <div className="flex border-b border-border-color">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors w-1/2 ${activeTab === t.id ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {t.id === 'logger' ? 'Workouts' : 'Measurements'}
              </button>
            ))}
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
                    draftKey={`draftWorkout_${activeProfileId}`}
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-background-light/95 backdrop-blur-sm border-t border-border-color/60 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === t.id ? 'text-brand-primary' : 'text-text-secondary'}`}
              aria-current={activeTab === t.id ? 'page' : undefined}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-xs font-semibold text-text-secondary"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            History
          </button>
        </div>
      </nav>
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        logs={activeLogs}
        onImportLogs={handleImportLogs}
        onExportLogs={handleExportLogs}
        onDeleteLog={deleteWorkoutLog}
        onUpdateLog={updateWorkoutLog}
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
