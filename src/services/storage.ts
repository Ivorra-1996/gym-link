import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ActiveSessionState, BodyWeightEntry, Routine, WorkoutSession } from '@/types';
import { generateId } from '@/utils/workout';

// ── Firestore helpers ─────────────────────────────────────────────────────────

function uid(): string {
  const u = auth.currentUser?.uid;
  if (!u) throw new Error('No authenticated user');
  return u;
}

const routinesRef  = () => collection(db, 'users', uid(), 'routines');
const sessionsRef  = () => collection(db, 'users', uid(), 'sessions');
const bodywtRef    = () => collection(db, 'users', uid(), 'bodyweight');

// ── Routines ──────────────────────────────────────────────────────────────────

export async function getRoutines(): Promise<Routine[]> {
  try {
    const snap = await getDocs(query(routinesRef(), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => d.data() as Routine);
  } catch {
    return [];
  }
}

export async function saveRoutine(routine: Routine): Promise<void> {
  await setDoc(doc(db, 'users', uid(), 'routines', routine.id), routine);
}

export async function deleteRoutine(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid(), 'routines', id));
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<WorkoutSession[]> {
  try {
    const snap = await getDocs(query(sessionsRef(), orderBy('startedAt', 'desc')));
    return snap.docs.map((d) => d.data() as WorkoutSession);
  } catch {
    return [];
  }
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  await setDoc(doc(db, 'users', uid(), 'sessions', session.id), session);
}

export async function getLastSessionForRoutine(
  routineId: string,
): Promise<WorkoutSession | null> {
  try {
    const snap = await getDocs(
      query(sessionsRef(), where('routineId', '==', routineId)),
    );
    if (snap.empty) return null;
    const all = snap.docs.map((d) => d.data() as WorkoutSession);
    return all.sort((a, b) => b.startedAt - a.startedAt)[0];
  } catch {
    return null;
  }
}

// ── Active session  (ephemeral — stays on device) ─────────────────────────────

const ACTIVE_KEY = '@gymlink/active_session';

export async function getActiveSession(): Promise<ActiveSessionState | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveActiveSession(state: ActiveSessionState): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(state));
}

export async function clearActiveSession(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}

// ── Body weight ────────────────────────────────────────────────────────────────

export async function getBodyWeightEntries(): Promise<BodyWeightEntry[]> {
  try {
    const snap = await getDocs(query(bodywtRef(), orderBy('date', 'desc')));
    return snap.docs.map((d) => d.data() as BodyWeightEntry);
  } catch {
    return [];
  }
}

export async function saveBodyWeightEntry(entry: BodyWeightEntry): Promise<void> {
  await setDoc(doc(db, 'users', uid(), 'bodyweight', entry.id), entry);
}

export async function deleteBodyWeightEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid(), 'bodyweight', id));
}

// ── Hydration (daily reset — stays on device) ─────────────────────────────────

const HYDRATION_KEY = '@gymlink/hydration';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getHydrationGlasses(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(HYDRATION_KEY);
    if (!raw) return 0;
    const { date, glasses } = JSON.parse(raw);
    return date === todayStr() ? glasses : 0;
  } catch {
    return 0;
  }
}

export async function setHydrationGlasses(glasses: number): Promise<void> {
  await AsyncStorage.setItem(
    HYDRATION_KEY,
    JSON.stringify({ date: todayStr(), glasses }),
  );
}

// ── Seed default routines ─────────────────────────────────────────────────────

export async function seedDefaultRoutinesIfEmpty(): Promise<void> {
  try {
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
          { libraryId: 'chest_1', name: 'Press de Banca',           sets: 4, reps: 8,  weight: 80 },
          { libraryId: 'chest_2', name: 'Press Inclinado',          sets: 3, reps: 10, weight: 60 },
          { libraryId: 'chest_5', name: 'Aperturas con Mancuernas', sets: 3, reps: 12, weight: 20 },
          { libraryId: 'tricep_2', name: 'Extensión en Polea',      sets: 3, reps: 12, weight: 30 },
          { libraryId: 'tricep_5', name: 'Press Cerrado',           sets: 3, reps: 10, weight: 60 },
        ],
      },
      {
        id: generateId(),
        name: 'Pull Day',
        muscleGroup: 'Espalda & Bíceps',
        createdAt: now,
        updatedAt: now,
        exercises: [
          { libraryId: 'back_4',  name: 'Jalón al Pecho',  sets: 4, reps: 10, weight: 60 },
          { libraryId: 'back_2',  name: 'Remo con Barra',  sets: 4, reps: 8,  weight: 70 },
          { libraryId: 'back_1',  name: 'Dominadas',       sets: 3, reps: 8,  weight: 0  },
          { libraryId: 'bicep_1', name: 'Curl con Barra',  sets: 3, reps: 12, weight: 30 },
          { libraryId: 'bicep_3', name: 'Curl Martillo',   sets: 3, reps: 12, weight: 14 },
        ],
      },
      {
        id: generateId(),
        name: 'Leg Day',
        muscleGroup: 'Piernas & Glúteos',
        createdAt: now,
        updatedAt: now,
        exercises: [
          { libraryId: 'leg_1', name: 'Sentadilla',               sets: 4, reps: 8,  weight: 100 },
          { libraryId: 'leg_2', name: 'Prensa de Piernas',        sets: 3, reps: 12, weight: 150 },
          { libraryId: 'leg_7', name: 'Peso Muerto Rumano',       sets: 3, reps: 10, weight: 80  },
          { libraryId: 'leg_6', name: 'Hip Thrust',               sets: 3, reps: 12, weight: 90  },
          { libraryId: 'leg_8', name: 'Elevación de Gemelos',     sets: 4, reps: 15, weight: 60  },
        ],
      },
    ];

    await Promise.all(defaults.map(saveRoutine));
  } catch {
    // Not authenticated yet — called again after login
  }
}
