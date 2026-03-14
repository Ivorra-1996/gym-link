import { ChevronRight, Clock, Flame } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import {
    borderWidth,
    twColors,
    twFonts,
    twRadius,
} from "../constants/tailwind-runtime-theme";

interface WorkoutCardProps {
  title: string;
  muscleGroup: string;
  duration: string;
  calories: string;
  exercises: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const WorkoutCard = ({
  title,
  muscleGroup,
  duration,
  calories,
  exercises,
}: WorkoutCardProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => (scale.value = withSpring(0.985))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.muscleGroup}>{muscleGroup}</Text>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={12} color={twColors.muted} />
              <Text style={styles.metaText}>{duration}</Text>
            </View>

            <View style={styles.metaItem}>
              <Flame size={12} color={twColors.muted} />
              <Text style={styles.metaText}>{calories}</Text>
            </View>

            <Text style={styles.metaText}>{exercises} ejercicios</Text>
          </View>
        </View>

        <View style={styles.chevronCircle}>
          <ChevronRight size={18} color={twColors.primary} />
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: twColors.background,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingRight: 10,
  },
  muscleGroup: {
    color: twColors.primary,
    fontSize: 12,
    fontFamily: twFonts.bold,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: twColors.foreground,
    fontSize: 16,
    fontFamily: twFonts.bold,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: twColors.muted,
    fontSize: 12,
    fontFamily: twFonts.regular,
  },
  chevronCircle: {
    width: 40,
    height: 40,
    borderRadius: twRadius.lg + 4,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default WorkoutCard;
