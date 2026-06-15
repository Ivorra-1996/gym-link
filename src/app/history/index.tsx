import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { goBack } from '@/utils/navigation';
import { ArrowLeft, Calendar, Clock, Dumbbell } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { getSessions } from '@/services/storage';
import { WorkoutSession } from '@/types';
import { formatDuration } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getSessions().then((s) => {
        setSessions(s);
        setLoading(false);
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
            <Pressable style={styles.backBtn} onPress={() => goBack('/profile')}>
              <ArrowLeft size={18} color={twColors.primary} />
            </Pressable>
            <Text style={styles.title}>Historial</Text>
          </View>

          {!loading && sessions.length === 0 && (
            <View style={styles.empty}>
              <Dumbbell size={40} color={twColors.muted} />
              <Text style={styles.emptyTitle}>Sin entrenamientos todavía</Text>
              <Text style={styles.emptySubtitle}>
                Completá tu primer sesión para verla aquí
              </Text>
            </View>
          )}

          {sessions.map((s, i) => (
            <Animated.View key={s.id} entering={FadeInUp.delay(i * 50)}>
              <Pressable
                style={styles.sessionCard}
                onPress={() => router.push(`/history/${s.id}` as never)}
              >
                <View style={styles.sessionTop}>
                  <Text style={styles.sessionName}>{s.routineName}</Text>
                  <View style={styles.datePill}>
                    <Calendar size={10} color={twColors.muted} />
                    <Text style={styles.dateText}>{formatDate(s.startedAt)}</Text>
                  </View>
                </View>
                <View style={styles.sessionMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={12} color={twColors.muted} />
                    <Text style={styles.metaText}>
                      {formatDuration(s.durationSeconds)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Dumbbell size={12} color={twColors.muted} />
                    <Text style={styles.metaText}>
                      {s.exercises.length} ejercicios
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.volumeText}>
                      {Math.round(s.totalVolume).toLocaleString('es-AR')} kg vol.
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 32 },
  content: {
    width: '100%',
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 32,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontFamily: twFonts.bold, color: twColors.foreground },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground },
  emptySubtitle: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, textAlign: 'center' },
  sessionCard: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 16,
    gap: 10,
  },
  sessionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionName: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.foreground },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: twColors.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  dateText: { fontSize: 10, fontFamily: twFonts.regular, color: twColors.muted },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.muted },
  volumeText: {
    fontSize: 12,
    fontFamily: twFonts.bold,
    color: twColors.primary,
  },
});
