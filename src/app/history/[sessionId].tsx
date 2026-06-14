import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSessions } from '@/services/storage';
import { WorkoutSession } from '@/types';
import { calculateVolume, formatDuration } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function SessionDetail() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    getSessions().then((all) => {
      setSession(all.find((s) => s.id === sessionId) ?? null);
    });
  }, [sessionId]);

  if (!session) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={18} color={twColors.primary} />
            </Pressable>
          </View>

          <Text style={styles.title}>{session.routineName}</Text>
          <Text style={styles.date}>{formatDate(session.startedAt)}</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Clock size={16} color={twColors.primary} />
              <Text style={styles.summaryValue}>{formatDuration(session.durationSeconds)}</Text>
              <Text style={styles.summaryLabel}>Duración</Text>
            </View>
            <View style={styles.summaryCard}>
              <TrendingUp size={16} color={twColors.primary} />
              <Text style={styles.summaryValue}>
                {Math.round(session.totalVolume).toLocaleString('es-AR')} kg
              </Text>
              <Text style={styles.summaryLabel}>Volumen total</Text>
            </View>
          </View>

          {session.exercises.map((ex) => {
            const exVolume = ex.sets.reduce(
              (acc, s) => acc + calculateVolume(s.weight, s.reps),
              0
            );
            return (
              <View key={ex.libraryId} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseVol}>
                    {Math.round(exVolume).toLocaleString('es-AR')} kg
                  </Text>
                </View>

                <View style={styles.setsTableHeader}>
                  <Text style={[styles.cellHeader, { width: 28 }]}>#</Text>
                  <Text style={[styles.cellHeader, { flex: 1 }]}>Peso</Text>
                  <Text style={[styles.cellHeader, { flex: 1 }]}>Reps</Text>
                  <Text style={[styles.cellHeader, { flex: 1 }]}>Volumen</Text>
                </View>

                {ex.sets.map((s, si) => (
                  <View key={si} style={styles.setRow}>
                    <Text style={[styles.cellText, { width: 28 }]}>{si + 1}</Text>
                    <Text style={[styles.cellText, { flex: 1 }]}>
                      {s.weight > 0 ? `${s.weight} kg` : 'PC'}
                    </Text>
                    <Text style={[styles.cellText, { flex: 1 }]}>{s.reps}</Text>
                    <Text style={[styles.cellText, { flex: 1, color: twColors.primary }]}>
                      {calculateVolume(s.weight, s.reps)} kg
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 40 },
  content: {
    width: '100%',
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    gap: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontFamily: twFonts.bold, color: twColors.foreground },
  date: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, textTransform: 'capitalize' },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: { fontSize: 18, fontFamily: twFonts.bold, color: twColors.foreground },
  summaryLabel: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: twColors.background,
  },
  statusText: { fontSize: 16, fontFamily: twFonts.medium, color: twColors.foreground },
  exerciseCard: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 14,
    gap: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseName: {
    fontSize: 13,
    fontFamily: twFonts.bold,
    color: twColors.primary,
    textTransform: 'uppercase',
  },
  exerciseVol: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted },
  setsTableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: borderWidth.default,
    borderBottomColor: twColors.border,
  },
  cellHeader: { fontSize: 10, fontFamily: twFonts.medium, color: twColors.muted, textTransform: 'uppercase', textAlign: 'center' },
  setRow: { flexDirection: 'row', paddingVertical: 3 },
  cellText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.foreground, textAlign: 'center' },
});
