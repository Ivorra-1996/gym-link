import { useFocusEffect } from '@react-navigation/native';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from "@/constants/tailwind-runtime-theme";
import { useRouter } from "expo-router";
import { ArrowLeft, TrendingUp } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, {
  Circle,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { getSessions } from "@/services/storage";
import { WorkoutSession } from "@/types";
import { calculateStreak, countWeekSessions } from "@/utils/workout";

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function getLast6Months(): { label: string; year: number; month: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
  });
}

function getMonthSessions(sessions: WorkoutSession[], year: number, month: number) {
  return sessions.filter((s) => {
    const d = new Date(s.startedAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

// ── Charts ─────────────────────────────────────────────────────────────────────

const CHART_W = 320;
const CHART_H = 160;
const PAD_L = 28;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 26;

function SessionsBarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;
  const slot = plotW / data.length;
  const barW = slot * 0.55;

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {[0, 0.5, 1].map((pct) => {
        const y = PAD_T + (1 - pct) * plotH;
        return (
          <React.Fragment key={pct}>
            <Line x1={PAD_L} y1={y} x2={CHART_W - PAD_R} y2={y} stroke={twColors.border} strokeWidth={0.5} />
            <SvgText x={PAD_L - 3} y={y + 4} textAnchor="end" fontSize={9} fill={twColors.muted}>
              {Math.round(maxVal * pct)}
            </SvgText>
          </React.Fragment>
        );
      })}
      {data.map((d, i) => {
        const barH = Math.max(2, (d.value / maxVal) * plotH);
        const x = PAD_L + i * slot + (slot - barW) / 2;
        const y = PAD_T + plotH - barH;
        return (
          <React.Fragment key={d.label}>
            <Rect x={x} y={y} width={barW} height={barH} rx={3} fill={twColors.primary} opacity={0.85} />
            <SvgText x={x + barW / 2} y={CHART_H - PAD_B + 14} textAnchor="middle" fontSize={10} fill={twColors.muted}>
              {d.label}
            </SvgText>
            {d.value > 0 && (
              <SvgText x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={twColors.primary} fontWeight="bold">
                {d.value}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function VolumeLineChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;
  const toX = (i: number) =>
    data.length < 2 ? PAD_L + plotW / 2 : PAD_L + (i / (data.length - 1)) * plotW;
  const toY = (v: number) => PAD_T + (1 - v / maxVal) * plotH;
  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {[0, 0.5, 1].map((pct) => {
        const y = PAD_T + (1 - pct) * plotH;
        const label = maxVal > 0 ? `${(maxVal * pct / 1000).toFixed(1)}t` : '0';
        return (
          <React.Fragment key={pct}>
            <Line x1={PAD_L} y1={y} x2={CHART_W - PAD_R} y2={y} stroke={twColors.border} strokeWidth={0.5} />
            <SvgText x={PAD_L - 3} y={y + 4} textAnchor="end" fontSize={9} fill={twColors.muted}>{label}</SvgText>
          </React.Fragment>
        );
      })}
      {data.length > 1 && (
        <Polyline points={points} fill="none" stroke={twColors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {data.map((d, i) => (
        <React.Fragment key={d.label}>
          <Circle cx={toX(i)} cy={toY(d.value)} r={4} fill={twColors.primary} />
          <SvgText x={toX(i)} y={CHART_H - PAD_B + 14} textAnchor="middle" fontSize={10} fill={twColors.muted}>
            {d.label}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function Stats() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
    }, [])
  );

  const months = getLast6Months();

  // Stats cards
  const totalSessions = sessions.length;
  const totalVolume = sessions.reduce((acc, s) => acc + s.totalVolume, 0);
  const totalVolumeTons = totalVolume / 1000;
  const streak = calculateStreak(sessions);
  const weekSessions = countWeekSessions(sessions);
  const avgDurationMin =
    totalSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / totalSessions / 60)
      : 0;
  const uniqueExercises = new Set(
    sessions.flatMap((s) => s.exercises.map((e) => e.libraryId))
  ).size;

  const statsCards = [
    { label: 'Sesiones totales', value: String(totalSessions), change: 'completadas', goal: 100, current: Math.min(100, totalSessions) },
    { label: 'Volumen total', value: `${totalVolumeTons.toFixed(1)}t`, change: 'kg levantados', goal: 50, current: Math.min(50, totalVolumeTons) },
    { label: 'Racha actual', value: `${streak} días`, change: 'días consecutivos', goal: 30, current: Math.min(30, streak) },
    { label: 'Esta semana', value: String(weekSessions), change: 'sesiones', goal: 4, current: Math.min(4, weekSessions) },
    { label: 'Duración promedio', value: `${avgDurationMin} min`, change: 'por sesión', goal: 60, current: Math.min(60, avgDurationMin) },
    { label: 'Ejercicios distintos', value: String(uniqueExercises), change: 'en total', goal: 20, current: Math.min(20, uniqueExercises) },
  ];

  // Chart data
  const barData = months.map((m) => ({
    label: m.label,
    value: getMonthSessions(sessions, m.year, m.month).length,
  }));

  const lineData = months.map((m) => ({
    label: m.label,
    value: getMonthSessions(sessions, m.year, m.month).reduce((acc, s) => acc + s.totalVolume, 0),
  }));

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={18} color={twColors.primary} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>

          <Animated.View entering={FadeInUp.duration(450)}>
            <Text style={styles.title}>Estadísticas</Text>
            <Text style={styles.subtitle}>Tu evolución completa</Text>
          </Animated.View>

          <View style={styles.cardsGrid}>
            {statsCards.map((stat, index) => {
              const pct = Math.min(100, Math.round((stat.current / stat.goal) * 100));
              return (
                <Animated.View
                  key={stat.label}
                  entering={FadeInDown.delay(60 + index * 60).duration(350)}
                  style={styles.card}
                >
                  <Text style={styles.cardLabel}>{stat.label}</Text>
                  <Text style={styles.cardValue}>{stat.value}</Text>
                  <View style={styles.cardChangeRow}>
                    <TrendingUp size={14} color={twColors.primary} />
                    <Text style={styles.cardChange}>{stat.change}</Text>
                  </View>
                  <View style={styles.goalRow}>
                    <Text style={styles.goalLabel}>Objetivo</Text>
                    <Text style={styles.goalLabel}>{pct}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: pct >= 100 ? twColors.primary : `${twColors.primary}B3`,
                        },
                      ]}
                    />
                  </View>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View entering={FadeInDown.delay(420).duration(400)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Sesiones por mes</Text>
            <SessionsBarChart data={barData} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(520).duration(400)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Volumen por mes</Text>
            <VolumeLineChart data={lineData} />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { alignItems: "center", paddingBottom: 24 },
  content: { width: "100%", maxWidth: 512, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 96, gap: 14 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginBottom: 4 },
  backText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.primary },
  title: { fontSize: 30, fontFamily: twFonts.bold, color: twColors.foreground, marginBottom: 6 },
  subtitle: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, marginBottom: 6 },
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48.5%", backgroundColor: twColors.card, borderWidth: borderWidth.default, borderColor: twColors.border, borderRadius: twRadius.sm, padding: 14 },
  cardLabel: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.mutedForeground, marginBottom: 4 },
  cardValue: { fontSize: 24, fontFamily: twFonts.bold, color: twColors.foreground },
  cardChangeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  cardChange: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.primary },
  goalRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalLabel: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.mutedForeground },
  progressTrack: { marginTop: 6, width: "100%", height: 8, borderRadius: 999, overflow: "hidden", backgroundColor: twColors.card2 },
  progressFill: { height: "100%", borderRadius: 999 },
  chartCard: { backgroundColor: twColors.card, borderWidth: borderWidth.default, borderColor: twColors.border, borderRadius: twRadius.sm, paddingHorizontal: 10, paddingVertical: 14, alignItems: 'center' },
  chartTitle: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground, marginBottom: 10, alignSelf: 'flex-start', paddingHorizontal: 6 },
});
