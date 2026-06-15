import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { goBack } from '@/utils/navigation';
import { ArrowLeft, Calendar, Clock, Dumbbell, Search, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

type Range = 'all' | '7d' | '1m' | '3m';

const RANGES: { key: Range; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: '7d',  label: '7 días' },
  { key: '1m',  label: 'Mes' },
  { key: '3m',  label: '3 meses' },
];

const RANGE_MS: Record<Exclude<Range, 'all'>, number> = {
  '7d': 7 * 86_400_000,
  '1m': 30 * 86_400_000,
  '3m': 90 * 86_400_000,
};

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
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<Range>('all');

  useFocusEffect(
    useCallback(() => {
      getSessions().then((s) => {
        setSessions(s);
        setLoading(false);
      });
    }, [])
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (range !== 'all' && now - s.startedAt > RANGE_MS[range]) return false;
      if (q) {
        const matchesRoutine = s.routineName.toLowerCase().includes(q);
        const matchesExercise = s.exercises.some((e) => e.name.toLowerCase().includes(q));
        if (!matchesRoutine && !matchesExercise) return false;
      }
      return true;
    });
  }, [sessions, query, range]);

  const isFiltering = query.trim() !== '' || range !== 'all';

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => goBack('/profile')}>
              <ArrowLeft size={18} color={twColors.primary} />
            </Pressable>
            <Text style={styles.title}>Historial</Text>
          </View>

          {/* Buscador */}
          <View style={styles.searchRow}>
            <Search size={15} color={twColors.muted} style={{ flexShrink: 0 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar rutina o ejercicio..."
              placeholderTextColor={twColors.muted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <X size={15} color={twColors.muted} />
              </Pressable>
            )}
          </View>

          {/* Chips de rango */}
          <View style={styles.chipsRow}>
            {RANGES.map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setRange(key)}
                style={[styles.chip, range === key && styles.chipActive]}
              >
                <Text style={[styles.chipText, range === key && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Contador de resultados cuando hay filtro activo */}
          {!loading && isFiltering && (
            <Text style={styles.resultCount}>
              {filtered.length === sessions.length
                ? `${filtered.length} sesiones`
                : `${filtered.length} de ${sessions.length} sesiones`}
            </Text>
          )}

          {/* Lista */}
          {!loading && filtered.length === 0 && (
            <View style={styles.empty}>
              <Dumbbell size={40} color={twColors.muted} />
              {isFiltering ? (
                <>
                  <Text style={styles.emptyTitle}>Sin resultados</Text>
                  <Text style={styles.emptySubtitle}>
                    Probá con otro término o cambiá el rango de fechas
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>Sin entrenamientos todavía</Text>
                  <Text style={styles.emptySubtitle}>
                    Completá tu primer sesión para verla aquí
                  </Text>
                </>
              )}
            </View>
          )}

          {filtered.map((s, i) => (
            <Animated.View key={s.id} entering={FadeInUp.delay(i * 40)}>
              <Pressable
                style={styles.sessionCard}
                onPress={() => router.push(`/history/${s.id}` as never)}
              >
                <View style={styles.sessionTop}>
                  <Text style={styles.sessionName} numberOfLines={1}>
                    {s.routineName}
                  </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontFamily: twFonts.bold, color: twColors.foreground },

  // Buscador
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: twFonts.regular,
    color: twColors.foreground,
    padding: 0,
  },

  // Chips
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
  },
  chipActive: {
    backgroundColor: twColors.primary,
    borderColor: twColors.primary,
  },
  chipText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.muted },
  chipTextActive: { color: twColors.background },

  // Contador
  resultCount: {
    fontSize: 12,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    marginTop: -4,
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Cards
  sessionCard: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 16,
    gap: 10,
  },
  sessionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sessionName: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.foreground, flex: 1 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: twColors.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  dateText: { fontSize: 10, fontFamily: twFonts.regular, color: twColors.muted },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.muted },
  volumeText: { fontSize: 12, fontFamily: twFonts.bold, color: twColors.primary },
});
