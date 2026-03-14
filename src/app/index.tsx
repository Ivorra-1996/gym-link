import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Image } from "expo-image";
import { Bell, Flame, TrendingUp, Trophy, Zap } from "lucide-react-native";
import { useState } from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import HydrationTracker from "../components/HydrationTracker";
import WorkoutCard from "../components/WorkoutCard";
import { twColors, twRadius } from "../constants/tailwind-runtime-theme";

const stats = [
  {
    icon: Flame,
    label: "Calorías",
    value: "1,240",
    color: twColors.destructive,
  },
  {
    icon: TrendingUp,
    label: "Racha",
    value: "12 días",
    color: twColors.primary,
  },
  { icon: Trophy, label: "PRs", value: "3", color: twColors.warning },
];

const todayWorkouts = [
  {
    title: "Push Day",
    muscleGroup: "Pecho & Tríceps",
    duration: "55 min",
    calories: "420 kcal",
    exercises: 6,
  },
  {
    title: "Core Blast",
    muscleGroup: "Abdominales",
    duration: "20 min",
    calories: "180 kcal",
    exercises: 4,
  },
];

const Index = () => {
  const [glasses, setGlasses] = useState(5);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <Image
            source={require("../../assets/hero-fitness.jpg")}
            contentFit="cover"
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />

          <View style={styles.heroBottom}>
            <View>
              <Text style={styles.heroSubtitle}>Buenas tardes 👋</Text>
              <Text style={styles.heroTitle}>Gym Link</Text>
            </View>

            <Pressable style={styles.bellButton}>
              <Bell size={18} color={twColors.foreground} />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>
        </View>

        <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
          <Animated.View entering={FadeInUp.delay(100)} style={styles.statsRow}>
            {stats.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <s.icon size={18} color={s.color} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100)}>
            <Pressable style={styles.quickActionCard}>
              <View style={styles.quickActionIconCircle}>
                <Zap size={20} color={twColors.background} />
              </View>
              <View style={styles.quickActionTextWrap}>
                <Text style={styles.quickActionTitle}>
                  Iniciar Entrenamiento
                </Text>
                <Text style={styles.quickActionSubtitle}>
                  Push Day programado para hoy
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100)}>
            <HydrationTracker
              glasses={glasses}
              goal={8}
              onAdd={() => setGlasses((g) => Math.min(g + 1, 8))}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100)}>
            <Text style={styles.sectionTitle}>Entrenamientos de hoy</Text>
            <View style={styles.workoutList}>
              {todayWorkouts.map((w) => (
                <WorkoutCard key={w.title} {...w} />
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: twColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    alignItems: "center",
  },
  heroContainer: {
    height: 220,
    width: "100%",
    maxWidth: 512,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,11,23,0.45)",
  },
  heroBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  heroSubtitle: {
    color: twColors.muted,
    fontSize: 14,
    marginBottom: 4,
  },
  heroTitle: {
    color: twColors.foreground,
    fontSize: 24,
    fontWeight: "700",
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: twRadius.lg + 4,
    backgroundColor: twColors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: twColors.primary,
  },
  content: {
    width: "100%",
    maxWidth: 512,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingBottom: 96,
    gap: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: twColors.background,
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.md + 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    minHeight: 96,
  },
  statValue: {
    color: twColors.foreground,
    fontWeight: "700",
    fontSize: 16,
    marginTop: 4,
  },
  statLabel: {
    color: twColors.muted,
    fontSize: 10,
    marginTop: 2,
  },
  quickActionCard: {
    backgroundColor: twColors.background,
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.md + 2,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: twColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  quickActionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: twRadius.lg + 4,
    backgroundColor: twColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionTextWrap: {
    flex: 1,
  },
  quickActionTitle: {
    color: twColors.foreground,
    fontSize: 14,
    fontWeight: "700",
  },
  quickActionSubtitle: {
    color: twColors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: twColors.foreground,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  workoutList: {
    gap: 12,
  },
});

export default Index;
