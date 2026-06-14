import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveSessionState, BodyWeightEntry, Routine, WorkoutSession } from '@/types';
import { generateId } from '@/utils/workout';

const KEYS = {
  ROUTINES: '@gymlink/routines',
  SESSIONS: '@gymlink/sessions',
  ACTIVE_SESSION: '@gymlink/active_session',
  BODYWEIGHT: '@gymlink/bodyweight',
  HYDRATION: '@gymlink/hydration',
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

// ── Hydration (daily reset) ────────────────────────────────────────────────────

function todayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getHydrationGlasses(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HYDRATION);
    if (!raw) return 0;
    const { date, glasses } = JSON.parse(raw);
    return date === todayDateStr() ? glasses : 0;
  } catch {
    return 0;
  }
}

export async function setHydrationGlasses(glasses: number): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.HYDRATION,
    JSON.stringify({ date: todayDateStr(), glasses })
  );
}

// ── Seed default routines ─────────────────────────────────────────────────────

export async function seedDefaultRoutinesIfEmpty(): Promise<void> {
  const existing = await getRoutines();
  if (existing.length > 0) return;

  const now = Date.now();
  const defaults: Routine[] = [
    {
      id: generateId(),
      name: 'Push Day',
      muscleGroup: 'Pecho & Tríceps',
      createdAt: now,
      updatedAt: now,
      exercises: [
        { libraryId: 'chest_1', name: 'Press de Banca', sets: 4, reps: 8, weight: 80 },
        { libraryId: 'chest_2', name: 'Press de Banca Inclinado', sets: 3, reps: 10, weight: 60 },
        { libraryId: 'chest_5', name: 'Aperturas con Mancuernas', sets: 3, reps: 12, weight: 20 },
        { libraryId: 'tricep_2', name: 'Extensión en Polea', sets: 3, reps: 12, weight: 30 },
        { libraryId: 'tricep_5', name: 'Press Cerrado', sets: 3, reps: 10, weight: 60 },
      ],
    },
    {
      id: generateId(),
      name: 'Pull Day',
      muscleGroup: 'Espalda & Bíceps',
      createdAt: now,
      updatedAt: now,
      exercises: [
        { libraryId: 'back_4', name: 'Jalón al Pecho', sets: 4, reps: 10, weight: 60 },
        { libraryId: 'back_2', name: 'Remo con Barra', sets: 4, reps: 8, weight: 70 },
        { libraryId: 'back_1', name: 'Dominadas', sets: 3, reps: 8, weight: 0 },
        { libraryId: 'bicep_1', name: 'Curl con Barra', sets: 3, reps: 12, weight: 30 },
        { libraryId: 'bicep_3', name: 'Curl Martillo', sets: 3, reps: 12, weight: 14 },
      ],
    },
    {
      id: generateId(),
      name: 'Leg Day',
      muscleGroup: 'Piernas & Glúteos',
      createdAt: now,
      updatedAt: now,
      exercises: [
        { libraryId: 'leg_1', name: 'Sentadilla', sets: 4, reps: 8, weight: 100 },
        { libraryId: 'leg_2', name: 'Prensa de Piernas', sets: 3, reps: 12, weight: 150 },
        { libraryId: 'leg_7', name: 'Peso Muerto Rumano', sets: 3, reps: 10, weight: 80 },
        { libraryId: 'leg_6', name: 'Hip Thrust', sets: 3, reps: 12, weight: 90 },
        { libraryId: 'leg_8', name: 'Elevación de Gemelos de Pie', sets: 4, reps: 15, weight: 60 },
      ],
    },
  ];

  await AsyncStorage.setItem(KEYS.ROUTINES, JSON.stringify(defaults));
}
