import React, { useState, useEffect, useMemo } from 'react';
import { Exercise, WorkoutLog, CustomRoutine, CustomExercise } from '../types';
import ExerciseArtwork from './ExerciseArtwork';
import ExerciseMuscles from './ExerciseMuscles';
import { getExerciseDetails } from '../exerciseDetails';
import ExerciseLogger, { newSetId } from './ExerciseLogger';
import RoutineEditor from './RoutineEditor';
import WorkoutFeedbackModal from './WorkoutFeedbackModal';
import ExercisePickerModal from './ExercisePickerModal';
import ExerciseInstructionModal from './ExerciseInstructionModal';

interface WorkoutLoggerProps {
  onSave: (log: WorkoutLog) => void;
  routines: CustomRoutine[];
  onAddRoutine: (routine: Omit<CustomRoutine, 'id'>) => CustomRoutine;
  logs: WorkoutLog[];
  customExercises: CustomExercise[];
  onAddCustomExercise: (exercise: Omit<CustomExercise, 'id'>) => CustomExercise;
  /** localStorage key for the in-progress workout, so it survives tab switches and app restarts. */
  draftKey: string;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);


const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ onSave, routines, onAddRoutine, logs, customExercises, onAddCustomExercise, draftKey }) => {
  const [draft] = useState<{ routine: CustomRoutine; exercises: Exercise[] } | null>(() => {
    try { return JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { return null; }
  });
  const [selectedRoutine, setSelectedRoutine] = useState<CustomRoutine | null>(draft?.routine ?? null);
  const [exercises, setExercises] = useState<Exercise[]>(draft?.exercises ?? []);

  useEffect(() => {
    try {
      if (selectedRoutine) localStorage.setItem(draftKey, JSON.stringify({ routine: selectedRoutine, exercises }));
      else localStorage.removeItem(draftKey);
    } catch { /* storage full or blocked: the workout still works in memory */ }
  }, [draftKey, selectedRoutine, exercises]);

  // Most recent sets logged for each exercise (logs are newest first).
  const lastTime = useMemo(() => {
    const map: Record<string, { date: string; sets: Exercise['sets'] }> = {};
    for (const log of logs) for (const ex of log.exercises) map[ex.name] ??= { date: log.date, sets: ex.sets };
    return map;
  }, [logs]);
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [pendingLog, setPendingLog] = useState<Omit<WorkoutLog, 'effort'> | null>(null);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [instructionModalState, setInstructionModalState] = useState<{isOpen: boolean, exerciseName: string | null}>({isOpen: false, exerciseName: null});

  const handleRoutineSelect = (routine: CustomRoutine) => {
    if (selectedRoutine?.id === routine.id) return;
    setSelectedRoutine(routine);
    setExercises(routine.exercises.map(name => ({ name, sets: [{ id: newSetId(), weight: '', reps: '' }] })));
  };

  const handleRoutineSave = (newRoutineData: Omit<CustomRoutine, 'id'>) => {
    const newRoutine = onAddRoutine(newRoutineData);
    handleRoutineSelect(newRoutine);
    setIsRoutineEditorOpen(false);
  };

  const handleSetChange = (exerciseName: string, updatedSets: { id: string; weight: string; reps: string }[]) => {
    setExercises(prev => prev.map(ex => ex.name === exerciseName ? { ...ex, sets: updatedSets } : ex));
  };
  
  const handleInitiateSave = () => {
    if (!selectedRoutine) return;
    const newLog: Omit<WorkoutLog, 'effort'> = {
      id: new Date().toISOString(),
      date: new Date().toISOString(),
      routineName: selectedRoutine.name,
      exercises: exercises.filter(e => e.sets.some(s => s.weight && s.reps)),
    };
    if (newLog.exercises.length > 0) {
      setPendingLog(newLog);
      setIsFeedbackModalOpen(true);
    } else {
      alert("Please log at least one set for an exercise before saving.");
    }
  };

  const handleConfirmSave = (effort: number) => {
    if (!pendingLog) return;
    const completeLog: WorkoutLog = { ...pendingLog, effort };
    onSave(completeLog);
    
    // Reset state
    setExercises([]);
    setSelectedRoutine(null);
    setPendingLog(null);
    setIsFeedbackModalOpen(false);
  };

  const handleAddExercises = (exerciseNames: string[]) => {
    const newExercises = exerciseNames.map(name => ({
      name,
      sets: [{ id: newSetId(), weight: '', reps: '' }]
    }));
    setExercises(prev => [...prev, ...newExercises]);
    setIsExercisePickerOpen(false);
  };

  const handleDiscard = () => {
    if (confirm('Discard this workout? The sets you entered will be lost.')) {
      setExercises([]);
      setSelectedRoutine(null);
    }
  };

  const handleShowInstructions = (exerciseName: string) => {
    setInstructionModalState({isOpen: true, exerciseName});
  };

  const sessionSets = exercises.flatMap(exercise => exercise.sets);
  const loggedSets = sessionSets.filter(set => set.weight && set.reps).length;
  const progress = sessionSets.length ? loggedSets / sessionSets.length : 0;

  return (
    <>
      <div className="workout-shell space-y-8 max-w-4xl mx-auto">
        <section className="workout-hero">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Your workouts</h2>
            {selectedRoutine && <span className="hero-pill">Session in progress</span>}
          </div>
          <ExerciseArtwork name="Dumbbell Curl" className="hero-art" />
        </section>
        <div className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Training overview">
          {[
            [logs.length, 'Sessions logged'],
            [routines.length, 'Your routines'],
            [logs.reduce((total, log) => total + log.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.weight && s.reps).length, 0), 0), 'Sets logged'],
          ].map(([value, label]) => <div key={label} className="stat-card"><span className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</span><span className="text-xs text-text-secondary mt-1">{label}</span></div>)}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">Choose your routine</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {routines.map(routine => (
              <button
                key={routine.id}
                onClick={() => handleRoutineSelect(routine)}
                className={`routine-card ${selectedRoutine?.id === routine.id ? 'is-selected' : ''}`}
                aria-pressed={selectedRoutine?.id === routine.id}
              >
                <div className="flex items-center justify-between w-full mb-3"><span className="routine-symbol">↗</span><span className="text-xs text-brand-light">{selectedRoutine?.id === routine.id ? 'Selected ✓' : 'Start →'}</span></div>
                <span className="text-sm font-bold text-text-primary">{routine.name}</span>
                <span className="text-xs text-text-secondary mt-1">{routine.exercises.length} exercises</span>
              </button>
            ))}
            <button
              onClick={() => setIsRoutineEditorOpen(true)}
              className="flex flex-col items-center justify-center text-center p-3 rounded-lg border-2 border-dashed border-border-color text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all duration-200 min-h-[144px]"
            >
              <PlusIcon />
              <span className="text-sm font-medium mt-2">New Routine</span>
            </button>
          </div>
        </div>
        
        {selectedRoutine ? (
          <div>
            <div className="tracking-panel mb-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-light">Active session</p>
                  <h3 className="mt-1 break-words text-xl font-bold">{selectedRoutine.name}</h3>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-text-secondary">{loggedSets} / {sessionSets.length} sets logged</span>
              </div>
              <progress className="session-progress mt-3" aria-label="Sets logged" value={progress} max={1} />
            </div>
            <div className="space-y-4">
              {exercises.map(exercise => (
                 <div key={exercise.name} className="exercise-card">
                    <div className="exercise-card-heading">
                        <div className="exercise-thumbnail"><ExerciseArtwork name={exercise.name} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="eyebrow mb-1">{getExerciseDetails(exercise.name).category}</p>
                          <h4 className="text-base font-semibold text-brand-light">{exercise.name}</h4>
                          <p className="text-sm text-text-secondary mt-1 leading-relaxed">{getExerciseDetails(exercise.name).description}</p>
                          <div className="mt-2"><ExerciseMuscles name={exercise.name} /></div>
                          {lastTime[exercise.name] && (
                            <p className="text-xs text-text-secondary mt-0.5">
                              Last time ({new Date(lastTime[exercise.name].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}):{' '}
                              <span className="text-text-primary">{lastTime[exercise.name].sets.map(s => `${s.weight}×${s.reps}`).join(' · ')}</span>
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={() => handleShowInstructions(exercise.name)} 
                          className="shrink-0 h-10 w-10 -mr-2 -mt-2 flex items-center justify-center rounded-full text-text-secondary hover:text-brand-light transition-colors"
                          aria-label={`View exercise guide for ${exercise.name}`}
                          title="View exercise guide"
                        >
                            <InfoIcon />
                        </button>
                    </div>
                    <div className="p-4 sm:p-5"><ExerciseLogger exercise={exercise} onSetChange={handleSetChange} /></div>
                </div>
              ))}
               <button
                  onClick={() => setIsExercisePickerOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-lg border-2 border-dashed border-border-color text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all duration-200"
                >
                  <PlusIcon />
                  <span>Add Exercise</span>
                </button>
            </div>
          </div>
        ) : (
             <div className="empty-session">
                <span className="routine-symbol mx-auto mb-4">＋</span>
                <p className="text-sm text-text-secondary">Choose a routine to start logging sets.</p>
            </div>
        )}

        {selectedRoutine && (
           <button
            onClick={handleInitiateSave}
            className="w-full bg-gradient-to-r from-brand-primary to-cyan-500 hover:from-brand-secondary hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-brand-primary/40 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Save Workout Session</span>
          </button>
        )}
        {selectedRoutine && (
          <button onClick={handleDiscard} className="w-full -mt-4 py-2 text-sm text-text-secondary hover:text-red-400 transition-colors">
            Discard workout
          </button>
        )}
      </div>
      <RoutineEditor
        isOpen={isRoutineEditorOpen}
        onClose={() => setIsRoutineEditorOpen(false)}
        onSave={handleRoutineSave}
        logs={logs}
        routines={routines}
        customExercises={customExercises}
        onAddCustomExercise={onAddCustomExercise}
      />
      <WorkoutFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onConfirm={handleConfirmSave}
        routineName={pendingLog?.routineName}
        setCount={loggedSets}
      />
      <ExercisePickerModal
        isOpen={isExercisePickerOpen}
        onClose={() => setIsExercisePickerOpen(false)}
        onAddExercises={handleAddExercises}
        customExercises={customExercises}
        onAddCustomExercise={onAddCustomExercise}
        currentExercises={exercises}
      />
      <ExerciseInstructionModal
        isOpen={instructionModalState.isOpen}
        onClose={() => setInstructionModalState({isOpen: false, exerciseName: null})}
        exerciseName={instructionModalState.exerciseName}
      />
    </>
  );
};

export default WorkoutLogger;
