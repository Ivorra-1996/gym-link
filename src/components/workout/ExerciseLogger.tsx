import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SetRow from './SetRow';
import { ActiveExercise, CompletedSet, SessionExercise } from '@/types';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

interface Props {
  exercise: ActiveExercise;
  exerciseIndex: number;
  lastSession?: SessionExercise;
  onUpdateSet: (setIndex: number, data: Partial<CompletedSet>) => void;
  onCompleteSet: (setIndex: number) => void;
  onAddSet: () => void;
  onStartTimer: () => void;
  onRemoveSet?: (setIndex: number) => void;
}

export default function ExerciseLogger({
  exercise,
  exerciseIndex,
  lastSession,
  onUpdateSet,
  onCompleteSet,
  onAddSet,
  onStartTimer,
  onRemoveSet,
}: Props) {
  const completedCount = exercise.sets.filter((s) => s.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.progressBadge}>
          {completedCount}/{exercise.sets.length}
        </Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.colLabel, { width: 24 }]}>#</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Anterior</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Peso</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Reps</Text>
        <Text style={[styles.colLabel, { width: 34 }]}></Text>
        {onRemoveSet && exercise.sets.length > 1 && (
          <Text style={[styles.colLabel, { width: 26 }]}></Text>
        )}
      </View>

      {exercise.sets.map((set, si) => {
        const last = lastSession?.sets[si];
        return (
          <SetRow
            key={si}
            setNumber={si + 1}
            set={set}
            lastWeight={last?.weight}
            lastReps={last?.reps}
            onChange={(data) => onUpdateSet(si, data)}
            onComplete={() => onCompleteSet(si)}
            onTimerStart={onStartTimer}
            onRemove={onRemoveSet && exercise.sets.length > 1 ? () => onRemoveSet(si) : undefined}
          />
        );
      })}

      <Pressable style={styles.addSetBtn} onPress={onAddSet}>
        <Plus size={13} color={twColors.primary} />
        <Text style={styles.addSetText}>Añadir serie</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    fontFamily: twFonts.bold,
    color: twColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressBadge: {
    fontSize: 11,
    fontFamily: twFonts.medium,
    color: twColors.muted,
    backgroundColor: twColors.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
    borderBottomWidth: borderWidth.default,
    borderBottomColor: twColors.border,
  },
  colLabel: {
    fontSize: 10,
    fontFamily: twFonts.medium,
    color: twColors.muted,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: twRadius.sm,
    borderWidth: borderWidth.default,
    borderColor: twColors.primary + '40',
    borderStyle: 'dashed',
  },
  addSetText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.primary },
});
