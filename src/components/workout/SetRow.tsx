import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CompletedSet } from '@/types';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

interface Props {
  setNumber: number;
  set: CompletedSet;
  lastWeight?: number;
  lastReps?: number;
  onChange: (data: Partial<CompletedSet>) => void;
  onComplete: () => void;
  onTimerStart: () => void;
}

export default function SetRow({
  setNumber,
  set,
  lastWeight,
  lastReps,
  onChange,
  onComplete,
  onTimerStart,
}: Props) {
  const handleComplete = () => {
    onComplete();
    onTimerStart();
  };

  return (
    <View style={[styles.row, set.completed && styles.rowCompleted]}>
      <Text style={styles.setNum}>{setNumber}</Text>

      <View style={styles.prevCol}>
        {lastWeight !== undefined && lastReps !== undefined ? (
          <Text style={styles.prevText}>
            {lastWeight > 0 ? `${lastWeight}kg` : 'PC'} × {lastReps}
          </Text>
        ) : (
          <Text style={styles.prevText}>—</Text>
        )}
      </View>

      <TextInput
        value={set.weight > 0 ? String(set.weight) : ''}
        onChangeText={(v) =>
          onChange({ weight: parseFloat(v.replace(',', '.')) || 0 })
        }
        placeholder={lastWeight !== undefined && lastWeight > 0 ? String(lastWeight) : '0'}
        placeholderTextColor={twColors.muted}
        keyboardType="decimal-pad"
        style={[styles.input, set.completed && styles.inputCompleted]}
        selectTextOnFocus
        editable={!set.completed}
      />

      <TextInput
        value={String(set.reps)}
        onChangeText={(v) => onChange({ reps: parseInt(v) || 0 })}
        keyboardType="numeric"
        style={[styles.input, set.completed && styles.inputCompleted]}
        selectTextOnFocus
        editable={!set.completed}
      />

      <Pressable
        style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
        onPress={handleComplete}
      >
        <Check size={14} color={set.completed ? twColors.background : twColors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderRadius: twRadius.sm,
  },
  rowCompleted: { opacity: 0.65 },
  setNum: {
    width: 24,
    fontSize: 13,
    fontFamily: twFonts.bold,
    color: twColors.muted,
    textAlign: 'center',
  },
  prevCol: { flex: 1, alignItems: 'center' },
  prevText: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted },
  input: {
    flex: 1,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    textAlign: 'center',
  },
  inputCompleted: {
    backgroundColor: twColors.primary + '14',
    borderColor: twColors.primary + '40',
  },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: {
    backgroundColor: twColors.primary,
    borderColor: twColors.primary,
  },
});
