import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveSessionState, BodyWeightEntry, Routine, WorkoutSession } from '@/types';

const KEYS = {
  ROUTINES: '@gymlink/routines',
  SESSIONS: '@gymlink/sessions',
  ACTIVE_SESSION: '@gymlink/active_session',
  BODYWEIGHT: '@gymlink/bodyweight',
};

// ── Routines ──────────────────────────────────────────────────────────────────

export async function getRoutines(): Promise<Routine[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ROUTINES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveRoutine(routine: Routine): Promise<void> {
  const routines = await getRoutines();
  const idx = routines.findIndex((r) => r.id === routine.id);
  if (idx >= 0) routines[idx] = routine;
  else routines.push(routine);
  await AsyncStorage.setItem(KEYS.ROUTINES, JSON.stringify(routines));
}

export async function deleteRoutine(id: string): Promise<void> {
  const routines = await getRoutines();
  await AsyncStorage.setItem(
    KEYS.ROUTINES,
    JSON.stringify(routines.filter((r) => r.id !== id))
  );
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
    const sessions: WorkoutSession[] = raw ? JSON.parse(raw) : [];
    return sessions.sort((a, b) => b.startedAt - a.startedAt);
  } catch {
    return [];
  }
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const sessions = await getSessions();
  sessions.push(session);
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

export async function getLastSessionForRoutine(routineId: string): Promise<WorkoutSession | null> {
  const sessions = await getSessions();
  return sessions.find((s) => s.routineId === routineId) ?? null;
}

// ── Active session ─────────────────────────────────────────────────────────────

export async function getActiveSession(): Promise<ActiveSessionState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveActiveSession(state: ActiveSessionState): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(state));
}

export async function clearActiveSession(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ACTIVE_SESSION);
}

// ── Body weight ────────────────────────────────────────────────────────────────

export async function getBodyWeightEntries(): Promise<BodyWeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BODYWEIGHT);
    const entries: BodyWeightEntry[] = raw ? JSON.parse(raw) : [];
    return entries.sort((a, b) => b.date - a.date);
  } catch {
    return [];
  }
}

export async function saveBodyWeightEntry(entry: BodyWeightEntry): Promise<void> {
  const entries = await getBodyWeightEntries();
  entries.push(entry);
  await AsyncStorage.setItem(KEYS.BODYWEIGHT, JSON.stringify(entries));
}

export async function deleteBodyWeightEntry(id: string): Promise<void> {
  const entries = await getBodyWeightEntries();
  await AsyncStorage.setItem(
    KEYS.BODYWEIGHT,
    JSON.stringify(entries.filter((e) => e.id !== id))
  );
}
