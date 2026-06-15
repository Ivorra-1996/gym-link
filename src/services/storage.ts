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

