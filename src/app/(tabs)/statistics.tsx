import { useFocusEffect } from '@react-navigation/native';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from "@/constants/tailwind-runtime-theme";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Dumbbell } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Easing,
  Pressable,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Circle, Line, Polygon } from "react-native-svg";
import { getSessions } from "@/services/storage";
import { WorkoutSession } from "@/types";

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const size = 320;

function getLast6Months(): { label: string; year: number; month: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
  });
}

function buildMonthlyData(sessions: WorkoutSession[]): {
  months: string[];
  data: Record<string, { dimension: string; value: number }[]>;
} {
  const monthDefs = getLast6Months();
  const months = monthDefs.map((m) => m.label);
  const data: Record<string, { dimension: string; value: number }[]> = {};

  for (const { label, year, month } of monthDefs) {
    const ms = sessions.filter((s) => {
      const d = new Date(s.startedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totalVolume = ms.reduce((acc, s) => acc + s.totalVolume, 0);
    const totalReps = ms.reduce(
      (acc, s) =>
        acc + s.exercises.reduce((ea, ex) => ea + ex.sets.reduce((sa, set) => sa + set.reps, 0), 0),
      0,
    );
    const weights = ms.flatMap((s) =>
      s.exercises.flatMap((ex) => ex.sets.map((set) => set.weight).filter((w) => w > 0)),
    );
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
    const avgDurSec =
      ms.length > 0 ? ms.reduce((acc, s) => acc + s.durationSeconds, 0) / ms.length : 0;

    data[label] = [
      { dimension: 'Fuerza',       value: Math.min(100, Math.round((maxWeight / 150) * 100)) },
      { dimension: 'Volumen',      value: Math.min(100, Math.round((totalVolume / 15000) * 100)) },
      { dimension: 'Repeticiones', value: Math.min(100, Math.round((totalReps / 300) * 100)) },
      { dimension: 'Consistencia', value: Math.min(100, Math.round((ms.length / 16) * 100)) },
      { dimension: 'Resistencia',  value: Math.min(100, Math.round((avgDurSec / 3600) * 100)) },
    ];
  }

  return { months, data };
}

const polarToCartesian = (cx: number, cy: number, radius: number, angleDeg: number) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) };
};

function RadarChart({
  months,
  monthlyData,
}: {
  months: string[];
  monthlyData: Record<string, { dimension: string; value: number }[]>;
}) {
  const [selectedMonth, setSelectedMonth] = React.useState(
    months.length > 0 ? months[months.length - 1] : '',
  );

  React.useEffect(() => {
    if (months.length > 0) setSelectedMonth(months[months.length - 1]);
  }, [months]);

  const prevMonth = React.useMemo(() => {
    const index = months.indexOf(selectedMonth);
    return index > 0 ? months[index - 1] : null;
  }, [selectedMonth, months]);

  const targetData = React.useMemo(() => {
    const d = monthlyData[selectedMonth] ?? [];
    return d.map((item, i) => ({
      dimension: item.dimension,
      actual: item.value,
      previous: prevMonth ? (monthlyData[prevMonth]?.[i]?.value ?? 0) : 0,
    }));
  }, [selectedMonth, prevMonth, monthlyData]);

  const targetAvg = React.useMemo(() => {
    const values = monthlyData[selectedMonth] ?? [];
    if (values.length === 0) return 0;
    return values.reduce((sum, item) => sum + item.value, 0) / values.length;
  }, [selectedMonth, monthlyData]);

  const [animatedData, setAnimatedData] = React.useState(targetData);
  const [animatedAvg, setAnimatedAvg] = React.useState(targetAvg);

  const animatedDataRef = React.useRef(animatedData);
  const animatedAvgRef = React.useRef(animatedAvg);

  React.useEffect(() => { animatedDataRef.current = animatedData; }, [animatedData]);
  React.useEffect(() => { animatedAvgRef.current = animatedAvg; }, [animatedAvg]);

  React.useEffect(() => {
    const fromData = animatedDataRef.current;
    const fromAvg = animatedAvgRef.current;
    const progress = new RNAnimated.Value(0);

    const listenerId = progress.addListener(({ value }) => {
      setAnimatedData(
        targetData.map((item, i) => ({
          dimension: item.dimension,
          actual: fromData[i]
            ? fromData[i].actual + (item.actual - fromData[i].actual) * value
            : item.actual,
          previous: fromData[i]
            ? fromData[i].previous + (item.previous - fromData[i].previous) * value
            : item.previous,
        })),
      );
      setAnimatedAvg(fromAvg + (targetAvg - fromAvg) * value);
    });

    const animation = RNAnimated.timing(progress, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      progress.removeListener(listenerId);
      animation.stop();
    };
  }, [targetData, targetAvg]);

  const dimensions = animatedData.map((item) => item.dimension);

  const center = size / 2;
  const maxRadius = 118;
  const levels = 5;
  const ringSize = 80;
  const ringCenter = ringSize / 2;
  const ringRadius = 34;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringArc = (animatedAvg / 100) * ringCircumference;

  const ringPoints = Array.from({ length: levels }, (_, i) => {
    const radius = ((i + 1) / levels) * maxRadius;
    return {
      key: `ring-${i}`,
      points: dimensions
        .map((_, index) => {
          const point = polarToCartesian(center, center, radius, (360 / dimensions.length) * index);
          return `${point.x},${point.y}`;
        })
        .join(' '),
    };
  });

  const axisLines = dimensions.map((_, index) => {
    const point = polarToCartesian(center, center, maxRadius, (360 / dimensions.length) * index);
    return { x: point.x, y: point.y };
  });

  const currentPoints = dimensions
    .map((_, index) => {
      const ratio = animatedData[index].actual / 100;
      const point = polarToCartesian(center, center, maxRadius * ratio, (360 / dimensions.length) * index);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const previousPoints = dimensions
    .map((_, index) => {
      const ratio = animatedData[index].previous / 100;
      const point = polarToCartesian(center, center, maxRadius * ratio, (360 / dimensions.length) * index);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const labelRadius = maxRadius + 16;
  const labelPoints = dimensions.map((_, index) =>
    polarToCartesian(center, center, labelRadius, (360 / dimensions.length) * index),
  );
  const scaleTicks = [100, 75, 50, 25, 0];

  if (dimensions.length === 0) return null;

  return (
    <View>
      <View style={styles.progressRow}>
        <View style={styles.progressRingWrap}>
          <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <Circle cx={ringCenter} cy={ringCenter} r={ringRadius} fill="none" stroke={twColors.border} strokeWidth={6} />
            <Circle
              cx={ringCenter} cy={ringCenter} r={ringRadius}
              fill="none" stroke={twColors.primary} strokeWidth={6} strokeLinecap="round"
              strokeDasharray={`${ringArc} ${ringCircumference}`}
              transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
            />
          </Svg>
          <View style={styles.progressCenter}>
            <Text style={styles.progressValue}>{Math.round(animatedAvg)}%</Text>
          </View>
        </View>
        <View>
          <Text style={styles.progressTitle}>Cumplimiento</Text>
          <Text style={styles.progressSubtitle}>de objetivos en {selectedMonth}</Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {ringPoints.map(({ key, points }) => (
            <Polygon key={key} points={points} fill="none" stroke={twColors.border} strokeWidth={borderWidth.default} />
          ))}

          {axisLines.map((line, index) => (
            <Line key={`axis-${index}`} x1={center} y1={center} x2={line.x} y2={line.y} stroke={twColors.border} strokeWidth={borderWidth.default} />
          ))}

          {prevMonth && (
            <Polygon points={previousPoints} fill={`${twColors.accent}26`} stroke={twColors.accent} strokeWidth={1.5} strokeDasharray="5 5" />
          )}

          <Polygon points={currentPoints} fill={`${twColors.primary}33`} stroke={twColors.primary} strokeWidth={2.5} />

          {dimensions.map((_, index) => {
            const point = polarToCartesian(
              center, center,
              maxRadius * (animatedData[index].actual / 100),
              (360 / dimensions.length) * index,
            );
            return <Circle key={`point-${index}`} cx={point.x} cy={point.y} r={3} fill={twColors.primary} />;
          })}
        </Svg>

        <View style={styles.labelsWrap}>
          {scaleTicks.map((tick) => {
            const y = tick === 0 ? center - 8 : center - (maxRadius * tick) / 100 - 8;
            return (
              <Text key={`tick-${tick}`} style={[styles.scaleTick, { top: y }]}>{tick}</Text>
            );
          })}

          {dimensions.map((dimension, index) => {
            const labelPoint = labelPoints[index];
            return (
              <Text key={dimension} style={[styles.axisLabel, { left: labelPoint.x - 42, top: labelPoint.y - 8 }]}>
                {dimension}
              </Text>
            );
          })}
        </View>
      </View>

      <View style={styles.legendRow}>
        {prevMonth && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: twColors.accent }]} />
            <Text style={styles.legendText}>{prevMonth} (anterior)</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: twColors.primary }]} />
          <Text style={styles.legendText}>{selectedMonth}</Text>
        </View>
      </View>

      <View style={styles.monthsWrap}>
        {months.map((month) => {
          const active = month === selectedMonth;
          return (
            <Pressable
              key={month}
              onPress={() => { if (month !== selectedMonth) setSelectedMonth(month); }}
              style={[styles.monthButton, active && styles.monthButtonActive]}
            >
              <Text style={[styles.monthButtonText, active && styles.monthButtonTextActive]}>
                {month}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function Statistics() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
    }, []),
  );

  const { months, data } = buildMonthlyData(sessions);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={18} color={twColors.primary} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>

          <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
            <View style={styles.badge}>
              <Dumbbell size={16} color={twColors.primary} />
              <Text style={styles.badgeText}>Mi progreso</Text>
            </View>
            <Text style={styles.title}>Rendimiento en el gimnasio</Text>
            <Text style={styles.subtitle}>Seleccioná un mes para ver tu evolución</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.chartCard}>
            <RadarChart months={months} monthlyData={data} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(450)} style={styles.ctaWrap}>
            <Pressable style={styles.ctaButton} onPress={() => router.push('/stats' as never)}>
              <Text style={styles.ctaText}>Ver más estadísticas</Text>
              <ChevronRight size={18} color={twColors.primaryForeground} />
            </Pressable>
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
  content: { width: "100%", maxWidth: 512, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 96, gap: 16 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginBottom: 4 },
  backText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.primary },
  header: { alignItems: "center" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: `${twColors.primary}1F`, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, marginBottom: 16,
  },
  badgeText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.primary },
  title: { fontSize: 28, lineHeight: 34, textAlign: "center", fontFamily: twFonts.bold, color: twColors.foreground, marginBottom: 8 },
  subtitle: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, textAlign: "center" },
  chartCard: {
    backgroundColor: twColors.card, borderWidth: borderWidth.default, borderColor: twColors.border,
    borderRadius: twRadius.sm, paddingHorizontal: 12, paddingVertical: 16,
  },
  chartWrapper: { width: "100%", height: 350, alignItems: "center", justifyContent: "center" },
  labelsWrap: { position: "absolute", width: size, height: size },
  axisLabel: { position: "absolute", fontSize: 11, fontFamily: twFonts.medium, color: twColors.mutedForeground, textAlign: "center", width: 88 },
  scaleTick: { position: "absolute", left: size / 2 - 4, fontSize: 11, fontFamily: twFonts.regular, color: twColors.mutedForeground },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 10 },
  progressRingWrap: { width: 80, height: 80, alignItems: "center", justifyContent: "center" },
  progressCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  progressValue: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground },
  progressTitle: { fontSize: 13, fontFamily: twFonts.bold, color: twColors.foreground },
  progressSubtitle: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted },
  legendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 14, marginTop: -4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 999 },
  legendText: { fontSize: 11, fontFamily: twFonts.medium, color: twColors.mutedForeground },
  monthsWrap: { marginTop: 14, flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 8 },
  monthButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: twRadius.sm, backgroundColor: twColors.secondary },
  monthButtonActive: { backgroundColor: twColors.primary },
  monthButtonText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.secondaryForeground },
  monthButtonTextActive: { color: twColors.primaryForeground },
  ctaWrap: { alignItems: "center" },
  ctaButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: twColors.primary, borderRadius: twRadius.sm,
    paddingHorizontal: 22, paddingVertical: 12, minWidth: 220,
  },
  ctaText: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.primaryForeground },
});
