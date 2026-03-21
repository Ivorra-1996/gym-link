import { Calendar, Plus } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import WorkoutCard from "../components/WorkoutCard";
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from "../constants/tailwind-runtime-theme";

const routines = [
  {
    id: "1",
    title: "Push Day",
    muscleGroup: "Pecho & Tríceps",
    duration: "55 min",
    calories: "420 kcal",
    exercises: 6,
  },
  {
    id: "2",
    title: "Pull Day",
    muscleGroup: "Espalda & Bíceps",
    duration: "50 min",
    calories: "380 kcal",
    exercises: 7,
  },
  {
    id: "3",
    title: "Leg Day",
    muscleGroup: "Piernas & Glúteos",
    duration: "60 min",
    calories: "500 kcal",
    exercises: 5,
  },
  {
    id: "4",
    title: "Core Blast",
    muscleGroup: "Abdominales",
    duration: "20 min",
    calories: "180 kcal",
    exercises: 4,
  },
  {
    id: "5",
    title: "Upper Power",
    muscleGroup: "Tren Superior",
    duration: "45 min",
    calories: "350 kcal",
    exercises: 6,
  },
];

const weekDays = ["L", "M", "X", "J", "V", "S", "D"];
const activeDays = [0, 1, 3, 4];

const Train = () => (
  <View style={styles.screen}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Entrenar</Text>
          <Pressable style={styles.addButton}>
            <Plus size={18} color={twColors.background} />
          </Pressable>
        </View>

        {/* Calendario semanal */}
        <Animated.View
          entering={FadeInUp.delay(50)}
          style={styles.calendarCard}
        >
          <View style={styles.calendarHeader}>
            <Calendar size={14} color={twColors.primary} />
            <Text style={styles.calendarTitle}>Esta semana</Text>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((d, i) => {
              const active = activeDays.includes(i);
              return (
                <View
                  key={d}
                  style={[styles.dayCell, active && styles.dayCellActive]}
                >
                  <Text
                    style={[styles.dayText, active && styles.dayTextActive]}
                  >
                    {d}
                  </Text>
                  {active && <View style={styles.dayDot} />}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Rutinas */}
        <Text style={styles.sectionTitle}>Mis Rutinas</Text>
        <View style={styles.routinesList}>
          {routines.map((r, i) => (
            <Animated.View
              key={r.title}
              entering={FadeInUp.delay(100 + i * 60)}
            >
              <WorkoutCard {...r} />
            </Animated.View>
          ))}
        </View>
      </View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: twColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 24,
  },
  content: {
    width: "100%",
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 96,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.md,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 12,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: twRadius.sm,
  },
  dayCellActive: {
    backgroundColor: twColors.primary + "26",
  },
  dayText: {
    fontSize: 12,
    fontFamily: twFonts.medium,
    color: twColors.muted,
  },
  dayTextActive: {
    color: twColors.primary,
  },
  dayDot: {
    marginTop: 4,
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: twColors.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    marginBottom: -8,
  },
  routinesList: {
    gap: 12,
  },
});

export default Train;
