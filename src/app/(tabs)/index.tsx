import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Bell, Calendar, ChevronRight, Flame, TrendingUp, Trophy, Utensils, Zap } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import HydrationTracker from '@/components/HydrationTracker';
import { getHydrationGlasses, getHydrationGoal, getNutritionGoals, getRoutines, getSessions, getTodayNutritionEntries, saveHydrationLog, setHydrationGlasses, setHydrationGoal } from '@/services/storage';
import { Routine } from '@/types';
import { calculateStreak, countWeekSessions } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function getTodayDayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function getNextScheduled(
  routines: Routine[],
  fromDay: number,
): { name: string; dayName: string; daysUntil: number } | null {
  for (let i = 1; i <= 7; i++) {
    const nextDay = (fromDay + i) % 7;
    const found = routines.find((r) => r.days?.includes(nextDay));
    if (found) return { name: found.name, dayName: DAY_NAMES[nextDay], daysUntil: i };
  }
  return null;
}

const Index = () => {
  const [glasses, setGlasses] = useState(0);
  const [goal, setGoal] = useState(8);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [calConsumed, setCalConsumed] = useState(0);
  const [calGoal, setCalGoal] = useState(2000);
  const pulse = useSharedValue(0);

  const todayIndex = getTodayDayIndex();
  const todayRoutine = routines.find((r) => r.days?.includes(todayIndex)) ?? null;
  const isRestDay = routines.length > 0 && !todayRoutine;
  const nextScheduled = isRestDay ? getNextScheduled(routines, todayIndex) : null;

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const quickActionPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.015 }],
    opacity: 0.95 + pulse.value * 0.05,
  }));

  useFocusEffect(
    useCallback(() => {
      getHydrationGlasses().then(setGlasses);
      getHydrationGoal().then(setGoal);
      getRoutines().then(setRoutines);
      getSessions().then((sessions) => {
        setStreak(calculateStreak(sessions));
        setTotalSessions(sessions.length);
        setWeekSessions(countWeekSessions(sessions));
      });
      getTodayNutritionEntries().then((entries) => {
        setCalConsumed(entries.reduce((s, e) => s + e.calories, 0));
      });
      getNutritionGoals().then((g) => setCalGoal(g.calories));
    }, [])
  );

  const persistHydration = async (nextGlasses: number, nextGoal: number) => {
    await setHydrationGlasses(nextGlasses);
    saveHydrationLog(nextGlasses, nextGoal).catch(() => {});
  };

  const handleAddGlass = async () => {
    const next = Math.min(glasses + 1, goal);
    setGlasses(next);
    await persistHydration(next, goal);
  };

  const handleRemoveGlass = async () => {
    const next = Math.max(glasses - 1, 0);
    setGlasses(next);
    await persistHydration(next, goal);
  };

  const handleGoalChange = async (newGoal: number) => {
    const clampedGlasses = Math.min(glasses, newGoal);
    setGoal(newGoal);
    if (clampedGlasses !== glasses) setGlasses(clampedGlasses);
    await setHydrationGoal(newGoal);
    await persistHydration(clampedGlasses, newGoal);
  };

  const handleQuickStart = () => {
    if (todayRoutine) {
      router.push(`/routine/${todayRoutine.id}` as never);
    } else {
      router.push('/train' as never);
    }
  };

  const stats = [
    { icon: Flame,      label: 'Entrenos',    value: String(totalSessions), color: twColors.destructive },
    { icon: TrendingUp, label: 'Racha',        value: streak > 0 ? `${streak}d` : '—', color: twColors.primary },
    { icon: Trophy,     label: 'Esta semana',  value: String(weekSessions),  color: twColors.warning },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <Image
            source={require('../../../assets/GymLink.png')}
            contentFit="cover"
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBottom}>
            <View />
            <Pressable style={styles.bellButton} onPress={() => router.push('/settings')}>
              <Bell size={18} color={twColors.foreground} />
            </Pressable>
          </View>
        </View>

        <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>

          {/* Stats */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.statsRow}>
            {stats.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <s.icon size={18} color={s.color} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Rutina de hoy */}
          {routines.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(100)} style={quickActionPulseStyle}>
              <Pressable style={styles.quickActionCard} onPress={handleQuickStart}>
                <View style={styles.quickActionIconCircle}>
                  <Zap size={20} color={twColors.background} />
                </View>
                <View style={styles.quickActionTextWrap}>
                  <Text style={styles.quickActionTitle}>Iniciar Entrenamiento</Text>
                  <Text style={styles.quickActionSubtitle}>Creá tu primera rutina</Text>
                </View>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.delay(100)} style={styles.todaySection}>
              <Text style={styles.sectionTitle}>
                {todayRoutine ? 'Rutina de hoy' : 'Hoy'}
              </Text>

              {todayRoutine ? (
                <View style={styles.todayCard}>
                  <View style={styles.todayCardContent}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>HOY</Text>
                      </View>
                      <Text style={styles.todayRoutineName}>{todayRoutine.name}</Text>
                      {todayRoutine.muscleGroup ? (
                        <Text style={styles.todayMuscle}>{todayRoutine.muscleGroup}</Text>
                      ) : null}
                    </View>
                    <View style={styles.todayExercisesBubble}>
                      <Text style={styles.todayExercisesCount}>{todayRoutine.exercises.length}</Text>
                      <Text style={styles.todayExercisesLabel}>ejercicios</Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.todayStartBtn}
                    onPress={() => router.push(`/routine/${todayRoutine.id}` as never)}
                  >
                    <Zap size={14} color={twColors.background} />
                    <Text style={styles.todayStartBtnText}>Iniciar</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.restDayCard}>
                  <Text style={styles.restDayTitle}>Día de descanso</Text>
                  <Text style={styles.restDaySub}>El descanso es parte del progreso</Text>
                  {nextScheduled && (
                    <View style={styles.nextRoutineRow}>
                      <Calendar size={12} color={twColors.muted} />
                      <Text style={styles.nextRoutineText}>
                        Próximo: {nextScheduled.dayName} — {nextScheduled.name}
                        {nextScheduled.daysUntil === 1 ? ' (mañana)' : ` (en ${nextScheduled.daysUntil} días)`}
                      </Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.restDayAltBtn}
                    onPress={() => router.push('/train' as never)}
                  >
                    <Text style={styles.restDayAltBtnText}>Ver todas las rutinas</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          )}

          {/* Hidratación */}
          <Animated.View entering={FadeInUp.delay(150)}>
            <HydrationTracker
              glasses={glasses}
              goal={goal}
              onAdd={handleAddGlass}
              onRemove={handleRemoveGlass}
              onGoalChange={handleGoalChange}
            />
          </Animated.View>

          {/* Nutrición */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <Pressable style={styles.nutritionCard} onPress={() => router.push('/nutrition' as never)}>
              <View style={styles.nutritionLeft}>
                <View style={styles.nutritionIconCircle}>
                  <Utensils size={16} color={twColors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nutritionTitle}>Nutrición</Text>
                  <Text style={styles.nutritionSub}>
                    {calConsumed > 0
                      ? `${calConsumed.toLocaleString('es-AR')} / ${calGoal.toLocaleString('es-AR')} kcal`
                      : 'Sin comidas registradas hoy'}
                  </Text>
                  {calConsumed > 0 && (
                    <View style={styles.nutritionBarBg}>
                      <View
                        style={[
                          styles.nutritionBarFill,
                          { width: `${Math.min((calConsumed / calGoal) * 100, 100)}%` as any },
                        ]}
                      />
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={16} color={twColors.muted} />
            </Pressable>
          </Animated.View>

        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24, alignItems: 'center' },
  heroContainer: {
    height: 220,
    width: '100%',
    maxWidth: 512,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: twRadius.sm,
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,11,23,0.45)',
  },
  heroBottom: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: twRadius.lg + 4,
    backgroundColor: twColors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 512,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingBottom: 96,
    gap: 20,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: twColors.background,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 96,
  },
  statValue: { color: twColors.foreground, fontFamily: twFonts.bold, fontSize: 16, marginTop: 4 },
  statLabel: { color: twColors.muted, fontSize: 10, fontFamily: twFonts.regular, marginTop: 2 },

  // Quick action (solo cuando no hay rutinas)
  quickActionCard: {
    backgroundColor: twColors.background,
    borderWidth: borderWidth.default,
    borderColor: 'transparent',
    borderRadius: twRadius.sm,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTextWrap: { flex: 1 },
  quickActionTitle: { color: twColors.foreground, fontSize: 14, fontFamily: twFonts.bold },
  quickActionSubtitle: { color: twColors.muted, fontSize: 12, fontFamily: twFonts.regular, marginTop: 2 },

  // Rutina de hoy
  todaySection: { gap: 10 },
  sectionTitle: { color: twColors.foreground, fontSize: 14, fontFamily: twFonts.bold },

  todayCard: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.primary + '40',
    borderRadius: twRadius.sm,
    padding: 16,
    gap: 14,
  },
  todayCardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  todayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: twColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  todayBadgeText: { fontSize: 10, fontFamily: twFonts.bold, color: twColors.background },
  todayRoutineName: { fontSize: 17, fontFamily: twFonts.bold, color: twColors.foreground },
  todayMuscle: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.muted, marginTop: 2 },
  todayExercisesBubble: {
    alignItems: 'center',
    backgroundColor: twColors.primary + '15',
    borderRadius: twRadius.sm,
    padding: 12,
    minWidth: 64,
  },
  todayExercisesCount: { fontSize: 22, fontFamily: twFonts.bold, color: twColors.primary },
  todayExercisesLabel: { fontSize: 10, fontFamily: twFonts.regular, color: twColors.primary, marginTop: 2 },
  todayStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: twColors.primary,
    borderRadius: twRadius.sm,
    paddingVertical: 12,
  },
  todayStartBtnText: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.background },

  // Día de descanso
  restDayCard: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 16,
    gap: 6,
  },
  restDayTitle: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground },
  restDaySub: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.muted },
  nextRoutineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  nextRoutineText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted, flex: 1 },
  restDayAltBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: twRadius.sm,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
  },
  restDayAltBtnText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted },

  // Nutrición
  nutritionCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nutritionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nutritionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionTitle: { fontSize: 13, fontFamily: twFonts.bold, color: twColors.foreground },
  nutritionSub: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted, marginTop: 2 },
  nutritionBarBg: {
    height: 3,
    borderRadius: 999,
    backgroundColor: twColors.border,
    overflow: 'hidden',
    marginTop: 6,
  },
  nutritionBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: twColors.primary,
  },
});

export default Index;
