import { Href, router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from "../constants/tailwind-runtime-theme";

interface WorkoutCardProps {
  id: string;
  title: string;
  muscleGroup: string;
  exercises: number;
  days?: number[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const WorkoutCard = ({
  id,
  title,
  muscleGroup,
  exercises,
  days,
}: WorkoutCardProps) => {
  const scale = useSharedValue(1);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <AnimatedPressable
      style={[
        styles.card,
        hoveredItem === title && styles.quickActionCardHovered,
      ]}
      onHoverIn={() => setHoveredItem(title)}
      onHoverOut={() => setHoveredItem(null)}
      onPressIn={() => (scale.value = withSpring(0.985))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={() => {
        router.push(`/routine/${id}` as Href);
      }}
    >
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.muscleGroup}>{muscleGroup}</Text>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{exercises} ejercicios</Text>
          </View>

          {days && days.length > 0 && (
            <View style={styles.daysRow}>
              {DAY_LABELS.map((d, i) => {
                const active = days.includes(i);
                return (
                  <View key={d} style={[styles.dayChip, active && styles.dayChipActive]}>
                    <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                      {d}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
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
    padding: 16,
  },
  quickActionCardHovered: {
    borderColor: twColors.primary,
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
  daysRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  dayChip: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
  },
  dayChipActive: {
    backgroundColor: twColors.primary + '20',
    borderColor: twColors.primary,
  },
  dayChipText: { fontSize: 9, fontFamily: twFonts.bold, color: twColors.muted },
  dayChipTextActive: { color: twColors.primary },
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
