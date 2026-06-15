import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Bell, Flame, TrendingUp, Trophy, Zap } from 'lucide-react-native';
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
import WorkoutCard from '@/components/WorkoutCard';
import { getHydrationGlasses, getHydrationGoal, getRoutines, getSessions, saveHydrationLog, setHydrationGlasses, setHydrationGoal } from '@/services/storage';
import { Routine } from '@/types';
import { calculateStreak, countWeekSessions } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

const Index = () => {
  const [glasses, setGlasses] = useState(0);
  const [goal, setGoal] = useState(8);
  const [quickHovered, setQuickHovered] = useState(false);
  const [firstRoutine, setFirstRoutine] = useState<Routine | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const pulse = useSharedValue(0);

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
      getRoutines().then((r) => setFirstRoutine(r[0] ?? null));
      getSessions().then((sessions) => {
        setStreak(calculateStreak(sessions));
        setTotalSessions(sessions.length);
        setWeekSessions(countWeekSessions(sessions));
      });
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
    if (firstRoutine) {
      router.push(`/routine/${firstRoutine.id}` as never);
    } else {
      router.push('/train' as never);
    }
  };

  const stats = [
    { icon: Flame, label: 'Entrenos', value: String(totalSessions), color: twColors.destructive },
    { icon: TrendingUp, label: 'Racha', value: streak > 0 ? `${streak}d` : '—', color: twColors.primary },
    { icon: Trophy, label: 'Esta semana', value: String(weekSessions), color: twColors.warning },
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
            style={[styles.heroImage]}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBottom}>
            <View />
            <Pressable
              style={styles.bellButton}
              onPress={() => router.push('/settings')}
            >
              <Bell size={18} color={twColors.foreground} />
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

          <Animated.View entering={FadeInUp.delay(100)} style={quickActionPulseStyle}>
            <Pressable
              style={[styles.quickActionCard, quickHovered && styles.quickActionCardHovered]}
              onHoverIn={() => setQuickHovered(true)}
              onHoverOut={() => setQuickHovered(false)}
              onPress={handleQuickStart}
            >
              <View style={styles.quickActionIconCircle}>
                <Zap size={20} color={twColors.background} />
              </View>
              <View style={styles.quickActionTextWrap}>
                <Text style={styles.quickActionTitle}>Iniciar Entrenamiento</Text>
                <Text style={styles.quickActionSubtitle}>
                  {firstRoutine ? firstRoutine.name : 'Creá tu primera rutina'}
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100)}>
            <HydrationTracker
              glasses={glasses}
              goal={goal}
              onAdd={handleAddGlass}
              onRemove={handleRemoveGlass}
              onGoalChange={handleGoalChange}
            />
          </Animated.View>

          {firstRoutine && (
            <Animated.View entering={FadeInUp.delay(100)}>
              <Text style={styles.sectionTitle}>Mis rutinas</Text>
              <View style={styles.workoutList}>
                <WorkoutCard
                  id={firstRoutine.id}
                  title={firstRoutine.name}
                  muscleGroup={firstRoutine.muscleGroup}
                  exercises={firstRoutine.exercises.length}
                  duration={`${firstRoutine.exercises.length * 8} min`}
                  calories={`${firstRoutine.exercises.length * 60} kcal`}
                />
              </View>
            </Animated.View>
          )}
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
    left: 0,
    right: 0,
    bottom: 0,
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
  statValue: {
    color: twColors.foreground,
    fontFamily: twFonts.bold,
    fontSize: 16,
    marginTop: 4,
  },
  statLabel: {
    color: twColors.muted,
    fontSize: 10,
    fontFamily: twFonts.regular,
    marginTop: 2,
  },
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
  quickActionCardHovered: { borderColor: twColors.primary },
  quickActionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: twRadius.lg + 4,
    backgroundColor: twColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTextWrap: { flex: 1 },
  quickActionTitle: {
    color: twColors.foreground,
    fontSize: 14,
    fontFamily: twFonts.bold,
  },
  quickActionSubtitle: {
    color: twColors.muted,
    fontSize: 12,
    fontFamily: twFonts.regular,
    marginTop: 2,
  },
  sectionTitle: {
    color: twColors.foreground,
    fontSize: 14,
    fontFamily: twFonts.bold,
    marginBottom: 10,
  },
  workoutList: { gap: 12 },
});

export default Index;
