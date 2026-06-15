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
import { ActiveSessionState, BodyWeightEntry, FoodEntry, HydrationLog, NutritionGoals, NutritionLog, Routine, WorkoutSession } from '@/types';

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
const HYDRATION_GOAL_KEY = '@gymlink/hydration_goal';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

export async function getHydrationGoal(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(HYDRATION_GOAL_KEY);
    return raw ? parseInt(raw, 10) : 8;
  } catch {
    return 8;
  }
}

export async function setHydrationGoal(goal: number): Promise<void> {
  await AsyncStorage.setItem(HYDRATION_GOAL_KEY, String(goal));
}

// ── Hydration logs (histórico en Firestore) ───────────────────────────────────

const hydrationLogsRef = () => collection(db, 'users', uid(), 'hydrationLogs');

export async function saveHydrationLog(glasses: number, goal: number): Promise<void> {
  const today = todayStr();
  await setDoc(doc(db, 'users', uid(), 'hydrationLogs', today), {
    date: today,
    glasses,
    goal,
    updatedAt: Date.now(),
  } satisfies HydrationLog);
}

export async function getHydrationLogs(limitDays = 90): Promise<HydrationLog[]> {
  try {
    const snap = await getDocs(query(hydrationLogsRef(), orderBy('date', 'desc')));
    return snap.docs.slice(0, limitDays).map((d) => d.data() as HydrationLog);
  } catch {
    return [];
  }
}

// ── Nutrition ─────────────────────────────────────────────────────────────────

const NUTRITION_GOALS_KEY = '@gymlink/nutrition_goals';
const NUTRITION_TODAY_KEY = '@gymlink/nutrition_today';

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 150,
  carbs: 220,
  fat: 70,
};

export async function getNutritionGoals(): Promise<NutritionGoals> {
  try {
    const raw = await AsyncStorage.getItem(NUTRITION_GOALS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_NUTRITION_GOALS;
  } catch {
    return DEFAULT_NUTRITION_GOALS;
  }
}

export async function setNutritionGoals(goals: NutritionGoals): Promise<void> {
  await AsyncStorage.setItem(NUTRITION_GOALS_KEY, JSON.stringify(goals));
}

export async function getTodayNutritionEntries(): Promise<FoodEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(NUTRITION_TODAY_KEY);
    if (!raw) return [];
    const { date, entries } = JSON.parse(raw);
    return date === todayStr() ? entries : [];
  } catch {
    return [];
  }
}

export async function saveTodayNutritionEntries(entries: FoodEntry[]): Promise<void> {
  await AsyncStorage.setItem(
    NUTRITION_TODAY_KEY,
    JSON.stringify({ date: todayStr(), entries }),
  );
}

export async function syncNutritionLog(entries: FoodEntry[], goals: NutritionGoals): Promise<void> {
  const today = todayStr();
  try {
    await setDoc(doc(db, 'users', uid(), 'nutritionLogs', today), {
      date: today,
      entries,
      goals,
      updatedAt: Date.now(),
    } satisfies NutritionLog);
  } catch {
    // local data is primary — network errors are non-critical
  }
}

