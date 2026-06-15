import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Calendar, ChevronRight, History, Plus, Zap } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import WorkoutCard from '@/components/WorkoutCard';
import { getRoutines, getSessions } from '@/services/storage';
import { Routine } from '@/types';
import { getWeekTrainingDays } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getTodayDayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

const Train = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [trainedDays, setTrainedDays] = useState<number[]>([]);
  const todayIndex = getTodayDayIndex();

  const plannedDays = new Set(routines.flatMap((r) => r.days ?? []));

  useFocusEffect(
    useCallback(() => {
      getRoutines().then(setRoutines);
      getSessions().then((sessions) => {
        setTrainedDays(getWeekTrainingDays(sessions));
      });
    }, [])
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Entrenar</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/routine/create' as never)}
            >
              <Plus size={18} color={twColors.background} />
            </Pressable>
          </View>

          <Animated.View entering={FadeInUp.delay(50)} style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Calendar size={14} color={twColors.primary} />
              <Text style={styles.calendarTitle}>Esta semana</Text>
              <Text style={styles.calendarSub}>
                {trainedDays.length} día{trainedDays.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.weekRow}>
              {weekDays.map((d, i) => {
                const trained = trainedDays.includes(i);
                const isToday = i === todayIndex;
                const planned = plannedDays.has(i);
                return (
                  <View
                    key={d}
                    style={[
                      styles.dayCell,
                      trained && styles.dayCellTrained,
                      isToday && styles.dayCellToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        trained && styles.dayTextTrained,
                        isToday && styles.dayTextToday,
                        planned && !trained && styles.dayTextPlanned,
                      ]}
                    >
                      {d}
                    </Text>
                    {trained && <View style={styles.dayDot} />}
                    {planned && !trained && <View style={styles.dayDotPlanned} />}
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Text style={styles.sectionTitle}>Mis Rutinas</Text>

          {routines.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(100)} style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Sin rutinas todavía</Text>
              <Text style={styles.emptySubtitle}>
                Tocá el + para crear tu primera rutina
              </Text>
              <Pressable
                style={styles.createBtn}
                onPress={() => router.push('/routine/create' as never)}
              >
                <Plus size={14} color={twColors.background} />
                <Text style={styles.createBtnText}>Crear rutina</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <View style={styles.routinesList}>
              {routines.map((r, i) => (
                <Animated.View key={r.id} entering={FadeInUp.delay(100 + i * 60)}>
                  <WorkoutCard
                    id={r.id}
                    title={r.name}
                    muscleGroup={r.muscleGroup}
                    exercises={r.exercises.length}
                    duration={`${r.exercises.length * 8} min`}
                    calories={`${r.exercises.length * 60} kcal`}
                    days={r.days}
                  />
                </Animated.View>
              ))}
            </View>
          )}

          {/* Herramientas */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.toolsSection}>
            <Text style={styles.sectionTitle}>Herramientas</Text>
            <View style={styles.toolsList}>
              {[
                { icon: History, label: 'Historial de entrenos', href: '/history' },
                { icon: Zap,     label: 'Calculadora 1RM',       href: '/tools/calculator' },
              ].map(({ icon: Icon, label, href }) => (
                <Pressable
                  key={label}
                  style={styles.toolRow}
                  onPress={() => router.push(href as never)}
                >
                  <View style={styles.toolIconWrap}>
                    <Icon size={15} color={twColors.primary} />
                  </View>
                  <Text style={styles.toolLabel}>{label}</Text>
                  <ChevronRight size={14} color={twColors.muted} />
                </Pressable>
              ))}
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 24 },
  content: {
    width: '100%',
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 96,
    gap: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontFamily: twFonts.bold, color: twColors.foreground },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.md,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  calendarTitle: { fontSize: 12, fontFamily: twFonts.bold, color: twColors.foreground },
  calendarSub: {
    marginLeft: 'auto' as any,
    fontSize: 11,
    fontFamily: twFonts.regular,
    color: twColors.muted,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: twRadius.sm },
  dayCellTrained: { backgroundColor: twColors.primary + '20' },
  dayCellToday: { backgroundColor: twColors.primary + '30', borderWidth: borderWidth.default, borderColor: twColors.primary },
  dayText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted },
  dayTextTrained: { color: twColors.primary },
  dayTextToday: { color: twColors.primary, fontFamily: twFonts.bold },
  dayDot: { marginTop: 4, width: 5, height: 5, borderRadius: 999, backgroundColor: twColors.primary },
  dayTextPlanned: { color: twColors.foreground },
  dayDotPlanned: { marginTop: 4, width: 5, height: 5, borderRadius: 999, borderWidth: 1.5, borderColor: twColors.primary },
  sectionTitle: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground, marginBottom: -8 },
  routinesList: { gap: 12 },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.md,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.foreground },
  emptySubtitle: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, textAlign: 'center' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: twColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: twRadius.sm,
    marginTop: 8,
  },
  createBtnText: { fontSize: 13, fontFamily: twFonts.bold, color: twColors.background },

  toolsSection: { gap: 10 },
  toolsList: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    overflow: 'hidden',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: borderWidth.default,
    borderBottomColor: twColors.border,
  },
  toolIconWrap: {
    width: 32,
    height: 32,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: { flex: 1, fontSize: 14, fontFamily: twFonts.medium, color: twColors.foreground },
});

export default Train;
