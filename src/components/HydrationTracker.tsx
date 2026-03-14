import { Droplets, Plus } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { twColors, twRadius } from "../constants/tailwind-runtime-theme";

interface HydrationTrackerProps {
  glasses: number;
  goal: number;
  onAdd: () => void;
}

const HydrationTracker = ({ glasses, goal, onAdd }: HydrationTrackerProps) => {
  const progress = Math.min((glasses / goal) * 100, 100);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 500 });
  }, [progress, progressWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Droplets size={18} color={twColors.primary} />
          <Text style={styles.title}>Hidratación</Text>
        </View>
        <Text style={styles.counter}>
          {glasses}/{goal} vasos
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, animatedStyle]} />
      </View>

      <View style={styles.glassesRow}>
        {Array.from({ length: goal }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.glassBar,
              i < glasses ? styles.glassActive : styles.glassInactive,
            ]}
          />
        ))}

        <Pressable onPress={onAdd} style={styles.addButton}>
          <Plus size={16} color={twColors.background} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: twColors.background,
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.md + 2,
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: twColors.foreground,
    fontWeight: "700",
    fontSize: 14,
  },
  counter: {
    color: twColors.muted,
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: twColors.border,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: twColors.primary,
    borderRadius: 999,
  },
  glassesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  glassBar: {
    width: 8,
    height: 28,
    borderRadius: 99,
  },
  glassActive: {
    backgroundColor: twColors.primary,
  },
  glassInactive: {
    backgroundColor: twColors.border,
  },
  addButton: {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: twRadius.lg + 1,
    backgroundColor: twColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HydrationTracker;
