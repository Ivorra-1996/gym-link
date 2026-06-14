import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ActiveExercise, ActiveSessionState, CompletedSet } from '@/types';
import { clearActiveSession, getActiveSession, saveActiveSession } from '@/services/storage';

interface WorkoutContextType {
  session: ActiveSessionState | null;
  startSession: (state: ActiveSessionState) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<CompletedSet>) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  setCurrentExercise: (index: number) => void;
  startRestTimer: (durationSeconds: number) => void;
  stopRestTimer: () => void;
  restSecondsRemaining: number;
  endSession: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ActiveSessionState | null>(null);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Crash recovery
  useEffect(() => {
    getActiveSession().then((saved) => {
      if (saved) setSession(saved);
    });
  }, []);

  // Persist on every change
  useEffect(() => {
    if (session) saveActiveSession(session);
  }, [session]);

  // Restore rest timer when coming back from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        if (session?.restTimerStartedAt) {
          const elapsed = Math.floor((Date.now() - session.restTimerStartedAt) / 1000);
          const remaining = Math.max(0, session.restDurationSeconds - elapsed);
          setRestSecondsRemaining(remaining);
        }
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [session]);

  const clearRestInterval = useCallback(() => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
  }, []);

  const startSession = useCallback((state: ActiveSessionState) => {
    setSession(state);
  }, []);

  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, data: Partial<CompletedSet>) => {
      setSession((prev) => {
        if (!prev) return prev;
        const exercises = prev.exercises.map((ex, ei) => {
          if (ei !== exerciseIndex) return ex;
          const sets = ex.sets.map((s, si) => (si === setIndex ? { ...s, ...data } : s));
          return { ...ex, sets };
        });
        return { ...prev, exercises };
      });
    },
    []
  );

  const addSet = useCallback((exerciseIndex: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const newSet: CompletedSet = {
          reps: last?.reps ?? ex.targetReps,
          weight: last?.weight ?? 0,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { ...prev, exercises };
    });
  }, []);

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        if (ex.sets.length <= 1) return ex;
        return { ...ex, sets: ex.sets.filter((_, si) => si !== setIndex) };
      });
      return { ...prev, exercises };
    });
  }, []);

  const setCurrentExercise = useCallback((index: number) => {
    setSession((prev) => prev ? { ...prev, currentExerciseIndex: index } : prev);
  }, []);

  const startRestTimer = useCallback(
    (durationSeconds: number) => {
      clearRestInterval();
      const startedAt = Date.now();
      setSession((prev) =>
        prev ? { ...prev, restTimerStartedAt: startedAt, restDurationSeconds: durationSeconds } : prev
      );
      setRestSecondsRemaining(durationSeconds);
      restIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, durationSeconds - elapsed);
        setRestSecondsRemaining(remaining);
        if (remaining === 0) clearRestInterval();
      }, 500);
    },
    [clearRestInterval]
  );

  const stopRestTimer = useCallback(() => {
    clearRestInterval();
    setRestSecondsRemaining(0);
    setSession((prev) =>
      prev ? { ...prev, restTimerStartedAt: null } : prev
    );
  }, [clearRestInterval]);

  const endSession = useCallback(() => {
    clearRestInterval();
    clearActiveSession();
    setSession(null);
    setRestSecondsRemaining(0);
  }, [clearRestInterval]);

  return (
    <WorkoutContext.Provider
      value={{
        session,
        startSession,
        updateSet,
        addSet,
        removeSet,
        setCurrentExercise,
        startRestTimer,
        stopRestTimer,
        restSecondsRemaining,
        endSession,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used inside WorkoutProvider');
  return ctx;
}
