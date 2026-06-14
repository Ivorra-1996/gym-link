import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ExerciseLogger from '@/components/workout/ExerciseLogger';
import RestTimer from '@/components/workout/RestTimer';
import { useWorkout } from '@/context/WorkoutContext';
import { getLastSessionForRoutine, saveSession } from '@/services/storage';
import { SessionExercise, WorkoutSession } from '@/types';
import { calculateVolume, formatDuration, generateId } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

export default function ActiveWorkout() {
  const {
    session,
    updateSet,
    addSet,
    removeSet,
    setCurrentExercise,
    startRestTimer,
    stopRestTimer,
    restSecondsRemaining,
    endSession,
  } = useWorkout();

  const [elapsed, setElapsed] = useState(0);
  const [lastSessionExercises, setLastSessionExercises] = useState<
    Record<string, SessionExercise>
  >({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session) return;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.startedAt]);

  useEffect(() => {
    if (!session) return;
    getLastSessionForRoutine(session.routineId).then((last) => {
      if (!last) return;
      const map: Record<string, SessionExercise> = {};
      last.exercises.forEach((ex) => {
        map[ex.libraryId] = ex;
      });
      setLastSessionExercises(map);
    });
  }, [session?.routineId]);

  if (!session) {
    router.replace('/' as never);
    return null;
  }

  const currentEx = session.exercises[session.currentExerciseIndex];

  const handleFinish = () => {
    Alert.alert('Finalizar entrenamiento', '¿Seguro que querés terminar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: async () => {
          const now = Date.now();
          const durationSecs = Math.floor((now - session.startedAt) / 1000);

          const exercises: SessionExercise[] = session.exercises.map((ex) => ({
            libraryId: ex.libraryId,
            name: ex.name,
            sets: ex.sets
              .filter((s) => s.completed)
              .map((s) => ({ reps: s.reps, weight: s.weight })),
          }));

          const totalVolume = exercises.reduce((acc, ex) => {
            return (
              acc +
              ex.sets.reduce((s, set) => s + calculateVolume(set.weight, set.reps), 0)
            );
          }, 0);

          const ws: WorkoutSession = {
            id: generateId(),
            routineId: session.routineId,
            routineName: session.routineName,
            startedAt: session.startedAt,
            endedAt: now,
            durationSeconds: durationSecs,
            exercises,
            totalVolume,
          };

          await saveSession(ws);
          endSession();
          router.replace('/' as never);
        },
      },
    ]);
  };

  const handleDiscard = () => {
    Alert.alert('Descartar sesión', 'Se perderá todo el progreso de esta sesión.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          endSession();
          router.replace('/' as never);
        },
      },
    ]);
  };

  const handleAddTime = (extra: number) => {
    if (!session.restTimerStartedAt) return;
    const newDuration = session.restDurationSeconds + extra;
    startRestTimer(newDuration);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.routineName}>{session.routineName}</Text>
          <Text style={styles.elapsedTime}>{formatDuration(elapsed)}</Text>
        </View>
        <Pressable style={styles.discardBtn} onPress={handleDiscard}>
          <X size={16} color={twColors.muted} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.exerciseTabsRow}
      >
        {session.exercises.map((ex, i) => {
          const done = ex.sets.every((s) => s.completed);
          const active = i === session.currentExerciseIndex;
          return (
            <Pressable
              key={i}
              onPress={() => setCurrentExercise(i)}
              style={[
                styles.exerciseTab,
                active && styles.exerciseTabActive,
                done && styles.exerciseTabDone,
              ]}
            >
              <Text
                style={[
                  styles.exerciseTabText,
                  active && styles.exerciseTabTextActive,
                ]}
                numberOfLines={1}
              >
                {ex.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {restSecondsRemaining > 0 && (
          <RestTimer
            secondsRemaining={restSecondsRemaining}
            totalSeconds={session.restDurationSeconds}
            onSkip={stopRestTimer}
            onAddTime={handleAddTime}
          />
        )}

        <ExerciseLogger
          exercise={currentEx}
          exerciseIndex={session.currentExerciseIndex}
          lastSession={lastSessionExercises[currentEx.libraryId]}
          onUpdateSet={(si, data) =>
            updateSet(session.currentExerciseIndex, si, data)
          }
          onCompleteSet={(si) =>
            updateSet(session.currentExerciseIndex, si, { completed: true })
          }
          onAddSet={() => addSet(session.currentExerciseIndex)}
          onStartTimer={() => startRestTimer(session.restDurationSeconds)}
        />

        <View style={styles.navRow}>
          <Pressable
            style={[
              styles.navBtn,
              session.currentExerciseIndex === 0 && styles.navBtnDisabled,
            ]}
            onPress={() =>
              setCurrentExercise(Math.max(0, session.currentExerciseIndex - 1))
            }
            disabled={session.currentExerciseIndex === 0}
          >
            <Text style={styles.navBtnText}>← Anterior</Text>
          </Pressable>

          {session.currentExerciseIndex < session.exercises.length - 1 ? (
            <Pressable
              style={styles.navBtn}
              onPress={() =>
                setCurrentExercise(session.currentExerciseIndex + 1)
              }
            >
              <Text style={styles.navBtnText}>Siguiente →</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.navBtn, styles.navBtnFinish]} onPress={handleFinish}>
              <Text style={[styles.navBtnText, { color: twColors.background }]}>
                Finalizar
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: borderWidth.default,
    borderBottomColor: twColors.border,
  },
  topBarLeft: { gap: 2 },
  routineName: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground },
  elapsedTime: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.primary },
  discardBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  exerciseTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: 'transparent',
    maxWidth: 150,
  },
  exerciseTabActive: { borderColor: twColors.primary, backgroundColor: twColors.primary + '20' },
  exerciseTabDone: { backgroundColor: twColors.primary + '40' },
  exerciseTabText: {
    fontSize: 12,
    fontFamily: twFonts.medium,
    color: twColors.muted,
  },
  exerciseTabTextActive: { color: twColors.primary },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
  },
  navBtnDisabled: { opacity: 0.35 },
  navBtnFinish: { backgroundColor: twColors.primary, borderColor: twColors.primary },
  navBtnText: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground },
});
