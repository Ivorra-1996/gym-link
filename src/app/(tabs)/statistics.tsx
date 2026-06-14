import {
    borderWidth,
    twColors,
    twFonts,
    twRadius,
} from "@/constants/tailwind-runtime-theme";
import { Link, useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Dumbbell } from "lucide-react-native";
import React from "react";
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

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"] as const;
const size = 320;

const monthlyData: Record<
  (typeof MONTHS)[number],
  { dimension: string; value: number }[]
> = {
  Ene: [
    { dimension: "Fuerza", value: 30 },
    { dimension: "Volumen", value: 25 },
    { dimension: "Repeticiones", value: 40 },
    { dimension: "Consistencia", value: 20 },
    { dimension: "Resistencia", value: 35 },
  ],
  Feb: [
    { dimension: "Fuerza", value: 40 },
    { dimension: "Volumen", value: 35 },
    { dimension: "Repeticiones", value: 45 },
    { dimension: "Consistencia", value: 40 },
    { dimension: "Resistencia", value: 40 },
  ],
  Mar: [
    { dimension: "Fuerza", value: 55 },
    { dimension: "Volumen", value: 50 },
    { dimension: "Repeticiones", value: 55 },
    { dimension: "Consistencia", value: 55 },
    { dimension: "Resistencia", value: 48 },
  ],
  Abr: [
    { dimension: "Fuerza", value: 62 },
    { dimension: "Volumen", value: 58 },
    { dimension: "Repeticiones", value: 60 },
    { dimension: "Consistencia", value: 65 },
    { dimension: "Resistencia", value: 55 },
  ],
  May: [
    { dimension: "Fuerza", value: 75 },
    { dimension: "Volumen", value: 68 },
    { dimension: "Repeticiones", value: 70 },
    { dimension: "Consistencia", value: 78 },
    { dimension: "Resistencia", value: 65 },
  ],
  Jun: [
    { dimension: "Fuerza", value: 85 },
    { dimension: "Volumen", value: 78 },
    { dimension: "Repeticiones", value: 80 },
    { dimension: "Consistencia", value: 88 },
    { dimension: "Resistencia", value: 75 },
  ],
};

const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
};

function RadarChart() {
  const [selectedMonth, setSelectedMonth] =
    React.useState<(typeof MONTHS)[number]>("Jun");

  const prevMonth = React.useMemo(() => {
    const index = MONTHS.indexOf(selectedMonth);
    return index > 0 ? MONTHS[index - 1] : null;
  }, [selectedMonth]);

  const targetData = React.useMemo(() => {
    return monthlyData[selectedMonth].map((item, i) => ({
      dimension: item.dimension,
      actual: item.value,
      previous: prevMonth ? monthlyData[prevMonth][i].value : 0,
    }));
  }, [selectedMonth, prevMonth]);

  const targetAvg = React.useMemo(() => {
    const values = monthlyData[selectedMonth];
    return values.reduce((sum, item) => sum + item.value, 0) / values.length;
  }, [selectedMonth]);

  const [animatedData, setAnimatedData] = React.useState(targetData);
  const [animatedAvg, setAnimatedAvg] = React.useState(targetAvg);

  const animatedDataRef = React.useRef(animatedData);
  const animatedAvgRef = React.useRef(animatedAvg);

  React.useEffect(() => {
    animatedDataRef.current = animatedData;
  }, [animatedData]);

  React.useEffect(() => {
    animatedAvgRef.current = animatedAvg;
  }, [animatedAvg]);

  React.useEffect(() => {
    const fromData = animatedDataRef.current;
    const fromAvg = animatedAvgRef.current;
    const progress = new RNAnimated.Value(0);

    const listenerId = progress.addListener(({ value }) => {
      setAnimatedData(
        targetData.map((item, i) => ({
          dimension: item.dimension,
          actual:
            fromData[i].actual + (item.actual - fromData[i].actual) * value,
          previous:
            fromData[i].previous +
            (item.previous - fromData[i].previous) * value,
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
    return dimensions
      .map((_, index) => {
        const point = polarToCartesian(
          center,
          center,
          radius,
          (360 / dimensions.length) * index,
        );
        return `${point.x},${point.y}`;
      })
      .join(" ");
  });

  const axisLines = dimensions.map((_, index) => {
    const point = polarToCartesian(
      center,
      center,
      maxRadius,
      (360 / dimensions.length) * index,
    );
    return { x: point.x, y: point.y };
  });

  const currentPoints = dimensions
    .map((_, index) => {
      const ratio = animatedData[index].actual / 100;
      const point = polarToCartesian(
        center,
        center,
        maxRadius * ratio,
        (360 / dimensions.length) * index,
      );
      return `${point.x},${point.y}`;
    })
    .join(" ");

  const previousPoints = dimensions
    .map((_, index) => {
      const ratio = animatedData[index].previous / 100;
      const point = polarToCartesian(
        center,
        center,
        maxRadius * ratio,
        (360 / dimensions.length) * index,
      );
      return `${point.x},${point.y}`;
    })
    .join(" ");

  const labelRadius = maxRadius + 16;
  const labelPoints = dimensions.map((_, index) =>
    polarToCartesian(
      center,
      center,
      labelRadius,
      (360 / dimensions.length) * index,
    ),
  );
  const scaleTicks = [100, 75, 50, 25, 0];

  return (
    <View>
      <View style={styles.progressRow}>
        <View style={styles.progressRingWrap}>
          <Svg
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            <Circle
              cx={ringCenter}
              cy={ringCenter}
              r={ringRadius}
              fill="none"
              stroke={twColors.border}
              strokeWidth={6}
            />
            <Circle
              cx={ringCenter}
              cy={ringCenter}
              r={ringRadius}
              fill="none"
              stroke={twColors.primary}
              strokeWidth={6}
              strokeLinecap="round"
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
          <Text style={styles.progressSubtitle}>
            de objetivos en {selectedMonth}
          </Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {ringPoints.map((points) => (
            <Polygon
              key={points}
              points={points}
              fill="none"
              stroke={twColors.border}
              strokeWidth={borderWidth.default}
            />
          ))}

          {axisLines.map((line, index) => (
            <Line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={line.x}
              y2={line.y}
              stroke={twColors.border}
              strokeWidth={borderWidth.default}
            />
          ))}

          {prevMonth && (
            <Polygon
              points={previousPoints}
              fill={`${twColors.accent}26`}
              stroke={twColors.accent}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
          )}

          <Polygon
            points={currentPoints}
            fill={`${twColors.primary}33`}
            stroke={twColors.primary}
            strokeWidth={2.5}
          />

          {dimensions.map((_, index) => {
            const point = polarToCartesian(
              center,
              center,
              maxRadius * (animatedData[index].actual / 100),
              (360 / dimensions.length) * index,
            );
            return (
              <Circle
                key={`point-${index}`}
                cx={point.x}
                cy={point.y}
                r={3}
                fill={twColors.primary}
              />
            );
          })}
        </Svg>

        <View style={styles.labelsWrap}>
          {scaleTicks.map((tick) => {
            const y =
              tick === 0 ? center - 8 : center - (maxRadius * tick) / 100 - 8;
            return (
              <Text key={`tick-${tick}`} style={[styles.scaleTick, { top: y }]}>
                {tick}
              </Text>
            );
          })}

          {dimensions.map((dimension, index) => {
            const labelPoint = labelPoints[index];
            return (
              <Text
                key={dimension}
                style={[
                  styles.axisLabel,
                  {
                    left: labelPoint.x - 42,
                    top: labelPoint.y - 8,
                  },
                ]}
              >
                {dimension}
              </Text>
            );
          })}
        </View>
      </View>

      <View style={styles.legendRow}>
        {prevMonth && (
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: twColors.accent }]}
            />
            <Text style={styles.legendText}>{prevMonth} (anterior)</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: twColors.primary }]}
          />
          <Text style={styles.legendText}>{selectedMonth}</Text>
        </View>
      </View>

      <View style={styles.monthsWrap}>
        {MONTHS.map((month) => {
          const active = month === selectedMonth;
          return (
            <Pressable
              key={month}
              onPress={() => {
                if (month !== selectedMonth) {
                  setSelectedMonth(month);
                }
              }}
              style={[styles.monthButton, active && styles.monthButtonActive]}
            >
              <Text
                style={[
                  styles.monthButtonText,
                  active && styles.monthButtonTextActive,
                ]}
              >
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

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Link href="/profile" asChild>
            <Pressable style={styles.backButton}>
              <ArrowLeft size={18} color={twColors.primary} />
              <Text style={styles.backText}>Volver</Text>
            </Pressable>
          </Link>
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={styles.header}
          >
            <View style={styles.badge}>
              <Dumbbell size={16} color={twColors.primary} />
              <Text style={styles.badgeText}>Mi progreso</Text>
            </View>
            <Text style={styles.title}>Rendimiento en el gimnasio</Text>
            <Text style={styles.subtitle}>
              Selecciona un mes para ver tu evolucion
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(120).duration(500)}
            style={styles.chartCard}
          >
            <RadarChart />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(220).duration(450)}
            style={styles.ctaWrap}
          >
            <Pressable
              style={styles.ctaButton}
              onPress={() => router.push("/stats")}
            >
              <Text style={styles.ctaText}>Ver mas estadisticas</Text>
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
  content: {
    width: "100%",
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 96,
    gap: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  backText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.primary },
  header: { alignItems: "center" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${twColors.primary}1F`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.primary },
  title: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    marginBottom: 8,
  },
  subtitle: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, textAlign: "center" },
  chartCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  chartWrapper: { width: "100%", height: 350, alignItems: "center", justifyContent: "center" },
  labelsWrap: { position: "absolute", width: size, height: size },
  axisLabel: {
    position: "absolute",
    fontSize: 11,
    fontFamily: twFonts.medium,
    color: twColors.mutedForeground,
    textAlign: "center",
    width: 88,
  },
  scaleTick: {
    position: "absolute",
    left: size / 2 - 4,
    fontSize: 11,
    fontFamily: twFonts.regular,
    color: twColors.mutedForeground,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 10,
  },
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: twColors.primary,
    borderRadius: twRadius.sm,
    paddingHorizontal: 22,
    paddingVertical: 12,
    minWidth: 220,
  },
  ctaText: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.primaryForeground },
});
