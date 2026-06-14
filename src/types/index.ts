export interface LibraryExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  imageUri?: string;
}

export interface RoutineExercise {
  libraryId: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  muscleGroup: string;
  exercises: RoutineExercise[];
  createdAt: number;
  updatedAt: number;
}

export interface CompletedSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ActiveExercise {
  libraryId: string;
  name: string;
  targetSets: number;
  targetReps: number;
  sets: CompletedSet[];
}

export interface ActiveSessionState {
  routineId: string;
  routineName: string;
  startedAt: number;
  exercises: ActiveExercise[];
  currentExerciseIndex: number;
  restTimerStartedAt: number | null;
  restDurationSeconds: number;
}

export interface CompletedSet_History {
  reps: number;
  weight: number;
}

export interface SessionExercise {
  libraryId: string;
  name: string;
  sets: CompletedSet_History[];
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  exercises: SessionExercise[];
  totalVolume: number;
}

export interface BodyWeightEntry {
  id: string;
  date: number;
  weight: number;
  notes?: string;
}
