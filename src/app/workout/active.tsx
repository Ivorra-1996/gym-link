import { router } from 'expo-router';
import { Trophy, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ConfirmModal } from '@/components/ConfirmModal';
import ExerciseLogger from '@/components/workout/ExerciseLogger';
import RestTimer from '@/components/workout/RestTimer';
import { useWorkout } from '@/context/WorkoutContext';
import { getLastSessionForRoutine, getSessions, saveSession } from '@/services/storage';
import { SessionExercise, WorkoutSession } from '@/types';
import { PR, calculateVolume, detectPRs, formatDuration, generateId } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

const REST_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];

export default function ActiveWorkout() {
  const {
    session,
    updateSet,
    addSet,
    removeSet,
    setCurrentExercise,
    startRestTimer,
    stopRestTimer,
    setRestDuration,
    restSecondsRemaining,
    endSession,
  } = useWorkout();

  const [elapsed, setElapsed] = useState(0);
  const [lastSessionExercises, setLastSessionExercises] = useState<
    Record<string, SessionExercise>
  >({});
  const [prModal, setPrModal] = useState<PR[] | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
      last.exercises.forEach((ex) => { map[ex.libraryId] = ex; });
      setLastSessionExercises(map);
    });
  }, [session?.routineId]);

  useEffect(() => {
    if (!session) router.replace('/' as never);
  }, [session]);

  if (!session) return null;

  const currentEx = session.exercises[session.currentExerciseIndex];

  const doFinish = async () => {
    setShowFinishConfirm(false);
    setIsSaving(true);
    try {
      const now = Date.now();
      const durationSecs = Math.floor((now - session.startedAt) / 1000);

      const exercises: SessionExercise[] = session.exercises.map((ex) => ({
        libraryId: ex.libraryId,
        name: ex.name,
        sets: ex.sets
          .filter((s) => s.completed)
          .map((s) => ({ reps: s.reps, weight: s.weight })),
      }));

      const totalVolume = exercises.reduce(
        (acc, ex) => acc + ex.sets.reduce((s, set) => s + calculateVolume(set.weight, set.reps), 0),
        0
      );

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

      const allSessions = await getSessions();
      const prs = detectPRs(ws, allSessions);
      await saveSession(ws);

      if (prs.length > 0) {
        setPrModal(prs);
      } else {
        endSession();
        router.replace('/' as never);
      }
    } catch {
      setIsSaving(false);
      setSaveError('No se pudo guardar el entrenamiento. Intentá de nuevo.');
    }
  };

  const doDiscard = () => {
    setShowDiscardConfirm(false);
    endSession();
    router.replace('/' as never);
  };

  const handleAddTime = (extra: number) => {
    const newDuration = session.restDurationSeconds + extra;
    startRestTimer(newDuration);
  };

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.routineName} numberOfLines={1}>{session.routineName}</Text>
          <Text style={styles.elapsedTime}>{formatDuration(elapsed)}</Text>
        </View>
        <Pressable style={styles.discardBtn} onPress={() => setShowDiscardConfirm(true)}>
          <X size={16} color={twColors.muted} />
        </Pressable>
      </View>

      {/* Exercise tabs */}
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
                style={[styles.exerciseTabText, active && styles.exerciseTabTextActive]}
                numberOfLines={1}
              >
                {ex.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Rest timer duration selector */}
      <View style={styles.restDurationRow}>
        <Text style={styles.restDurationLabel}>Descanso:</Text>
        {REST_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setRestDuration(opt.value)}
            style={[
              styles.restDurationPill,
              session.restDurationSeconds === opt.value && styles.restDurationPillActive,
            ]}
          >
            <Text
              style={[
                styles.restDurationPillText,
                session.restDurationSeconds === opt.value && styles.restDurationPillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

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
          onUpdateSet={(si, data) => updateSet(session.currentExerciseIndex, si, data)}
          onCompleteSet={(si) => updateSet(session.currentExerciseIndex, si, { completed: true })}
          onAddSet={() => addSet(session.currentExerciseIndex)}
          onStartTimer={() => startRestTimer(session.restDurationSeconds)}
          onRemoveSet={(si) => removeSet(session.currentExerciseIndex, si)}
        />

        {/* Navigation */}
        <View style={styles.navRow}>
          <Pressable
            style={[styles.navBtn, session.currentExerciseIndex === 0 && styles.navBtnDisabled]}
            onPress={() => setCurrentExercise(Math.max(0, session.currentExerciseIndex - 1))}
            disabled={session.currentExerciseIndex === 0}
          >
            <Text style={styles.navBtnText}>← Anterior</Text>
          </Pressable>
          <Pressable
            style={[
              styles.navBtn,
              session.currentExerciseIndex === session.exercises.length - 1 && styles.navBtnDisabled,
            ]}
            onPress={() => setCurrentExercise(session.currentExerciseIndex + 1)}
            disabled={session.currentExerciseIndex === session.exercises.length - 1}
          >
            <Text style={styles.navBtnText}>Siguiente →</Text>
          </Pressable>
        </View>

        {saveError ? (
          <View style={styles.saveErrorBox}>
            <Text style={styles.saveErrorText}>{saveError}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.finishBtn, isSaving && styles.finishBtnDisabled]}
          onPress={() => { setSaveError(null); setShowFinishConfirm(true); }}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={twColors.background} />
          ) : (
            <>
              <Trophy size={15} color={twColors.background} />
              <Text style={styles.finishBtnText}>Finalizar entrenamiento</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={showFinishConfirm}
        title="Finalizar entrenamiento"
        message="¿Seguro que querés terminar la sesión?"
        confirmLabel="Finalizar"
        onConfirm={doFinish}
        onCancel={() => setShowFinishConfirm(false)}
      />

      <ConfirmModal
        visible={showDiscardConfirm}
        title="Descartar sesión"
        message="Se perderá todo el progreso de esta sesión."
        confirmLabel="Descartar"
        destructive
        onConfirm={doDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* PR modal */}
      {prModal && (
        <PRModal
          prs={prModal}
          onDismiss={() => {
            setPrModal(null);
            endSession();
            router.replace('/' as never);
          }}
        />
      )}
    </View>
  );
}

// ── PR Modal ────────────────────────────────────────────────────────────────

function PRModal({ prs, onDismiss }: { prs: PR[]; onDismiss: () => void }) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 16, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 220 });
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal transparent visible onRequestClose={onDismiss}>
      <View style={prStyles.overlay}>
        <Animated.View style={[prStyles.card, cardStyle]}>
          <View style={prStyles.trophyWrap}>
            <Trophy size={38} color={twColors.background} />
          </View>
          <Text style={prStyles.title}>¡Nuevos Records!</Text>
          <Text style={prStyles.subtitle}>Superaste tus marcas personales</Text>

          <View style={prStyles.list}>
            {prs.map((pr, i) => (
              <View
                key={pr.libraryId}
                style={[prStyles.prRow, i < prs.length - 1 && prStyles.prRowBorder]}
              >
                <Text style={prStyles.prName} numberOfLines={1}>{pr.name}</Text>
                <Text style={prStyles.prWeight}>{pr.weight} kg</Text>
              </View>
            ))}
          </View>

          <Pressable style={prStyles.btn} onPress={onDismiss}>
            <Text style={prStyles.btnText}>¡A seguir creciendo!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const prStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: twColors.card,
    borderRadius: 20,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    gap: 6,
  },
  trophyWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: twColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  list: {
    width: '100%',
    backgroundColor: twColors.card2,
    borderRadius: twRadius.sm,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    marginVertical: 8,
    overflow: 'hidden',
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  prRowBorder: {
    borderBottomWidth: borderWidth.default,
    borderBottomColor: twColors.border,
  },
  prName: {
    flex: 1,
    fontSize: 14,
    fontFamily: twFonts.medium,
    color: twColors.foreground,
    marginRight: 12,
  },
  prWeight: {
    fontSize: 16,
    fontFamily: twFonts.bold,
    color: twColors.primary,
  },
  btn: {
    marginTop: 6,
    width: '100%',
    backgroundColor: twColors.primary,
    borderRadius: twRadius.sm,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontFamily: twFonts.bold,
    color: twColors.background,
  },
});

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
  topBarLeft: { flex: 1, gap: 2, marginRight: 12 },
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
    alignItems: 'center',
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
  exerciseTabDone: { backgroundColor: twColors.primary + '40', borderColor: twColors.primary + '60' },
  exerciseTabText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted },
  exerciseTabTextActive: { color: twColors.primary },
  restDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
    borderBottomWidth: borderWidth.default,
    borderBottomColor: twColors.border,
  },
  restDurationLabel: {
    fontSize: 11,
    fontFamily: twFonts.medium,
    color: twColors.muted,
    marginRight: 2,
  },
  restDurationPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: 'transparent',
  },
  restDurationPillActive: {
    backgroundColor: twColors.primary + '26',
    borderColor: twColors.primary,
  },
  restDurationPillText: { fontSize: 11, fontFamily: twFonts.medium, color: twColors.muted },
  restDurationPillTextActive: { color: twColors.primary },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
  },
  navBtnDisabled: { opacity: 0.35 },
  navBtnText: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary,
  },
  finishBtnDisabled: { opacity: 0.6 },
  finishBtnText: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.background },
  saveErrorBox: {
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: twRadius.sm,
    backgroundColor: '#ef444420',
    borderWidth: borderWidth.default,
    borderColor: '#ef4444',
  },
  saveErrorText: { fontSize: 13, fontFamily: twFonts.medium, color: '#ef4444', textAlign: 'center' },
});
