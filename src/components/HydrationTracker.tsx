import { CheckCircle, Droplets, Minus, Plus, Settings2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from "../constants/tailwind-runtime-theme";

const ML_PER_GLASS = 250;

interface HydrationTrackerProps {
  glasses: number;
  goal: number;
  onAdd: () => void;
  onRemove: () => void;
  onGoalChange: (newGoal: number) => void;
}

const HydrationTracker = ({
  glasses,
  goal,
  onAdd,
  onRemove,
  onGoalChange,
}: HydrationTrackerProps) => {
  const [editingGoal, setEditingGoal] = useState(false);
  const goalReached = glasses >= goal;
  const progress = Math.min((glasses / goal) * 100, 100);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 500 });
  }, [progress, progressWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const totalMl = glasses * ML_PER_GLASS;
  const goalMl = goal * ML_PER_GLASS;

  const handleGoalDecrease = () => {
    if (goal > 4) onGoalChange(goal - 1);
  };

  const handleGoalIncrease = () => {
    if (goal < 16) onGoalChange(goal + 1);
  };

  return (
    <View style={[styles.card, goalReached && styles.cardComplete]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Droplets size={18} color={goalReached ? twColors.primary : twColors.primary} />
          <Text style={styles.title}>Hidratación</Text>
        </View>
        <View style={styles.headerRight}>
          {goalReached ? (
            <View style={styles.completeBadge}>
              <CheckCircle size={12} color={twColors.background} />
              <Text style={styles.completeBadgeText}>Meta lograda</Text>
            </View>
          ) : (
            <Text style={styles.counter}>
              {glasses}/{goal} vasos
            </Text>
          )}
          <Pressable onPress={() => setEditingGoal((v) => !v)} style={styles.editGoalBtn}>
            <Settings2 size={14} color={editingGoal ? twColors.primary : twColors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, animatedStyle]} />
      </View>

      <Text style={styles.mlText}>
        {totalMl >= 1000
          ? `${(totalMl / 1000).toFixed(1).replace('.0', '')} L`
          : `${totalMl} ml`}
        {' / '}
        {goalMl >= 1000
          ? `${(goalMl / 1000).toFixed(1).replace('.0', '')} L`
          : `${goalMl} ml`}
      </Text>

      <View style={styles.row}>
        <View style={styles.glassesRow}>
          {Array.from({ length: Math.min(goal, 12) }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.glassBar,
                i < glasses ? styles.glassActive : styles.glassInactive,
              ]}
            />
          ))}
          {goal > 12 && (
            <Text style={styles.moreText}>+{goal - 12}</Text>
          )}
        </View>
        <View style={styles.controls}>
          <Pressable
            onPress={onRemove}
            disabled={glasses <= 0}
            style={[styles.ctrlBtn, styles.ctrlBtnMinus, glasses <= 0 && styles.ctrlBtnDisabled]}
          >
            <Minus size={16} color={glasses <= 0 ? twColors.muted : twColors.primary} />
          </Pressable>
          <Pressable
            onPress={onAdd}
            disabled={glasses >= goal}
            style={[styles.ctrlBtn, glasses >= goal && styles.ctrlBtnDisabled]}
          >
            <Plus size={16} color={glasses >= goal ? twColors.muted : twColors.background} />
          </Pressable>
        </View>
      </View>

      {editingGoal && (
        <View style={styles.goalEditRow}>
          <Text style={styles.goalEditLabel}>Meta diaria:</Text>
          <View style={styles.goalEditControls}>
            <Pressable
              onPress={handleGoalDecrease}
              disabled={goal <= 4}
              style={[styles.goalBtn, goal <= 4 && styles.ctrlBtnDisabled]}
            >
              <Minus size={13} color={goal <= 4 ? twColors.muted : twColors.foreground} />
            </Pressable>
            <Text style={styles.goalValue}>{goal} vasos</Text>
            <Pressable
              onPress={handleGoalIncrease}
              disabled={goal >= 16}
              style={[styles.goalBtn, goal >= 16 && styles.ctrlBtnDisabled]}
            >
              <Plus size={13} color={goal >= 16 ? twColors.muted : twColors.foreground} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: twColors.background,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 14,
    gap: 12,
  },
  cardComplete: {
    borderColor: twColors.primary,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: twColors.foreground,
    fontFamily: twFonts.bold,
    fontSize: 14,
  },
  counter: {
    color: twColors.muted,
    fontSize: 12,
    fontFamily: twFonts.regular,
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: twColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  completeBadgeText: {
    fontSize: 11,
    fontFamily: twFonts.bold,
    color: twColors.background,
  },
  editGoalBtn: {
    padding: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: twColors.border,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: twColors.primary,
    borderRadius: 999,
  },
  mlText: {
    fontSize: 11,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    textAlign: "right",
    marginTop: -6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  glassesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    flexWrap: "wrap",
  },
  glassBar: {
    width: 7,
    height: 24,
    borderRadius: 99,
  },
  glassActive: {
    backgroundColor: twColors.primary,
  },
  glassInactive: {
    backgroundColor: twColors.border,
  },
  moreText: {
    fontSize: 10,
    fontFamily: twFonts.medium,
    color: twColors.muted,
  },
  controls: {
    flexDirection: "row",
    gap: 10,
  },
  ctrlBtn: {
    width: 34,
    height: 34,
    borderRadius: twRadius.lg + 1,
    backgroundColor: twColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlBtnMinus: {
    backgroundColor: twColors.border,
  },
  ctrlBtnDisabled: {
    opacity: 0.4,
  },
  goalEditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: borderWidth.default,
    borderTopColor: twColors.border,
  },
  goalEditLabel: {
    fontSize: 12,
    fontFamily: twFonts.medium,
    color: twColors.muted,
  },
  goalEditControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalBtn: {
    width: 28,
    height: 28,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  goalValue: {
    fontSize: 13,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    minWidth: 60,
    textAlign: "center",
  },
});

export default HydrationTracker;
