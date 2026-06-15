import { router, useLocalSearchParams } from 'expo-router';
import { goBack } from '@/utils/navigation';
import { ArrowLeft, Play, SquarePen } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRoutines } from '@/services/storage';
import { useWorkout } from '@/context/WorkoutContext';
import { Routine, ActiveSessionState, CompletedSet } from '@/types';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={mStyles.overlay}>
        <View style={mStyles.card}>
          <Text style={mStyles.title}>{title}</Text>
          <Text style={mStyles.message}>{message}</Text>
          <View style={mStyles.btnRow}>
            <Pressable style={mStyles.cancelBtn} onPress={onCancel}>
              <Text style={mStyles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[mStyles.confirmBtn, destructive && mStyles.destructiveBtn]}
              onPress={onConfirm}
            >
              <Text style={[mStyles.confirmText, destructive && mStyles.destructiveText]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function RoutinePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const { session, startSession } = useWorkout();

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getRoutines().then((all) => {
        setRoutine(all.find((r) => r.id === id) ?? null);
        setLoading(false);
      });
    }, [id])
  );

  const handleStart = () => {
    if (!routine) return;
    if (session) {
      setShowDiscardModal(true);
    } else {
      launchSession();
    }
  };

  const launchSession = () => {
    if (!routine) return;
    setShowDiscardModal(false);
    const initialSession: ActiveSessionState = {
      routineId: routine.id,
      routineName: routine.name,
      startedAt: Date.now(),
      currentExerciseIndex: 0,
      restTimerStartedAt: null,
      restDurationSeconds: 90,
      exercises: routine.exercises.map((ex) => ({
        libraryId: ex.libraryId,
        name: ex.name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        sets: Array.from({ length: ex.sets }, (): CompletedSet => ({
          reps: ex.reps,
          weight: ex.weight,
          completed: false,
        })),
      })),
    };
    startSession(initialSession);
    router.push('/workout/active' as never);
  };

  if (loading) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Cargando...</Text>
      </View>
    );
  }
  if (!routine) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Rutina no encontrada</Text>
        <Pressable onPress={() => goBack('/train')}>
          <Text style={[styles.statusText, { color: twColors.primary, marginTop: 12 }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => goBack('/train')}>
              <ArrowLeft size={18} color={twColors.primary} />
              <Text style={styles.backText}>Volver</Text>
            </Pressable>
            <Pressable
              style={styles.editBtn}
              onPress={() => router.push(`/routine/create?routineId=${routine.id}` as never)}
            >
              <SquarePen size={16} color={twColors.foreground} />
            </Pressable>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>{routine.name}</Text>
            <Text style={styles.subtitle}>{routine.muscleGroup}</Text>
          </View>

          <View>
            <Text style={styles.exerciseListTitle}>
              Ejercicios{' '}
              <Text style={styles.exerciseCant}>({routine.exercises.length})</Text>
            </Text>
            <View style={styles.exerciseList}>
              {routine.exercises.map((exercise, i) => (
                <View key={`${exercise.libraryId}_${i}`} style={styles.exerciseCard}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseMetaRow}>
                    <View style={styles.exerciseMetaItem}>
                      <Text style={styles.exerciseMetaLabel}>Series</Text>
                      <Text style={styles.exerciseMetaValue}>{exercise.sets}</Text>
                    </View>
                    <View style={styles.exerciseMetaItem}>
                      <Text style={styles.exerciseMetaLabel}>Repeticiones</Text>
                      <Text style={styles.exerciseMetaValue}>{exercise.reps}</Text>
                    </View>
                    <View style={styles.exerciseMetaItem}>
                      <Text style={styles.exerciseMetaLabel}>Peso</Text>
                      <Text style={styles.exerciseMetaValue}>
                        {exercise.weight > 0 ? `${exercise.weight} kg` : 'PC'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.startButton} onPress={handleStart}>
          <Play size={18} color={twColors.background} />
          <Text style={styles.startButtonText}>Iniciar Entrenamiento</Text>
        </Pressable>
      </View>

      <ConfirmModal
        visible={showDiscardModal}
        title="Sesión en progreso"
        message="Ya tenés un entrenamiento activo. ¿Querés descartarlo y empezar este?"
        confirmLabel="Descartar y empezar"
        destructive
        onConfirm={launchSession}
        onCancel={() => setShowDiscardModal(false)}
      />
    </View>
  );
}

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: twColors.card,
    borderRadius: twRadius.sm,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground },
  message: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.muted },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary,
    alignItems: 'center',
  },
  confirmText: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.background },
  destructiveBtn: { backgroundColor: twColors.destructive },
  destructiveText: { color: '#fff' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 120 },
  content: {
    width: '100%',
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.primary },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { gap: 4 },
  title: { fontSize: 22, fontFamily: twFonts.bold, color: twColors.foreground },
  subtitle: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: twColors.background,
  },
  statusText: { fontSize: 16, fontFamily: twFonts.medium, color: twColors.foreground },
  exerciseListTitle: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground, marginBottom: 12 },
  exerciseCant: { fontSize: 14, color: twColors.muted },
  exerciseList: { gap: 12 },
  exerciseCard: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 16,
    gap: 12,
  },
  exerciseName: {
    fontSize: 14,
    fontFamily: twFonts.bold,
    color: twColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseMetaItem: { flex: 1, alignItems: 'center' },
  exerciseMetaLabel: { fontSize: 10, fontFamily: twFonts.regular, color: twColors.muted },
  exerciseMetaValue: {
    fontSize: 24,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: twColors.background,
    borderTopWidth: borderWidth.default,
    borderTopColor: twColors.border,
  },
  startButton: {
    backgroundColor: twColors.primary,
    borderRadius: twRadius.sm,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startButtonText: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.background },
});
