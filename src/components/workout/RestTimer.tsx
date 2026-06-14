import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { formatRestTimer } from '@/utils/workout';
import { twColors, twFonts, twRadius, borderWidth } from '@/constants/tailwind-runtime-theme';

interface Props {
  secondsRemaining: number;
  totalSeconds: number;
  onSkip: () => void;
  onAddTime: (extra: number) => void;
}

export default function RestTimer({ secondsRemaining, totalSeconds, onSkip, onAddTime }: Props) {
  if (secondsRemaining === 0) return null;

  const pct = Math.max(0, secondsRemaining / totalSeconds);

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      exiting={FadeOutDown.springify()}
      style={styles.container}
    >
      <View style={styles.row}>
        <View style={styles.timerBlock}>
          <Text style={styles.label}>Descanso</Text>
          <Text style={[styles.time, secondsRemaining <= 10 && styles.timeUrgent]}>
            {formatRestTimer(secondsRemaining)}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.extraBtn} onPress={() => onAddTime(30)}>
            <Text style={styles.extraBtnText}>+30s</Text>
          </Pressable>
          <Pressable style={styles.skipBtn} onPress={onSkip}>
            <X size={14} color={twColors.muted} />
            <Text style={styles.skipText}>Saltar</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.primary + '60',
    borderRadius: twRadius.sm,
    padding: 14,
    marginVertical: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  timerBlock: { flex: 1, gap: 6 },
  label: { fontSize: 10, fontFamily: twFonts.medium, color: twColors.muted, textTransform: 'uppercase' },
  time: { fontSize: 32, fontFamily: twFonts.bold, color: twColors.foreground },
  timeUrgent: { color: twColors.destructive },
  progressBar: {
    height: 3,
    backgroundColor: twColors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: twColors.primary,
    borderRadius: 2,
  },
  actions: { gap: 8 },
  extraBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary + '26',
    alignItems: 'center',
  },
  extraBtnText: { fontSize: 12, fontFamily: twFonts.bold, color: twColors.primary },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    justifyContent: 'center',
  },
  skipText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted },
});
