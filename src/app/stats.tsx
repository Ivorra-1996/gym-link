import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from "@/constants/tailwind-runtime-theme";
import { useRouter } from "expo-router";
import { ArrowLeft, TrendingUp } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Circle, Line, Polyline, Rect } from "react-native-svg";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"] as const;

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

const statsCards = [
  {
    label: "Sesiones totales",
    value: "72",
    change: "+12 este mes",
    goal: 80,
    current: 72,
  },
  {
    label: "PR en press banca",
    value: "95 kg",
    change: "+5 kg",
    goal: 100,
    current: 95,
  },
  {
    label: "Volumen total (ton)",
    value: "184",
    change: "+22 ton",
    goal: 200,
    current: 184,
  },
  {
    label: "Dias consecutivos",
    value: "18",
    change: "Racha actual",
    goal: 30,
    current: 18,
  },
  {
    label: "Promedio reps/serie",
    value: "10.4",
    change: "+0.8",
    goal: 12,
    current: 10.4,
  },
  {
    label: "Grupos musculares",
    value: "5/5",
    change: "Completo",
    goal: 5,
    current: 5,
  },
];

const dimensionNames = [
  "Fuerza",
  "Volumen",
  "Repeticiones",
  "Consistencia",
  "Resistencia",
];

const evolutionByMonth = MONTHS.map((month) => {
  const entry: Record<string, string | number> = { mes: month };
  monthlyData[month].forEach((item) => {
    entry[item.dimension] = item.value;
  });
  return entry;
});

const chartColors = [
  twColors.primary,
  twColors.ring,
  twColors.warning,
  twColors.accent,
  twColors.destructive,
];

function GroupedBarsChart() {
  const width = 440;
  const height = 220;
  const left = 28;
  const right = 10;
  const top = 10;
  const bottom = 28;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const groupWidth = plotWidth / evolutionByMonth.length;
  const barGap = 2;
  const barWidth = Math.max(
    4,
    (groupWidth - 8 - barGap * (dimensionNames.length - 1)) /
      dimensionNames.length,
  );

  const gridTicks = [0, 25, 50, 75, 100];

  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {gridTicks.map((tick) => {
          const y = top + (1 - tick / 100) * plotHeight;
          return (
            <Line
              key={`grid-${tick}`}
              x1={left}
              y1={y}
              x2={width - right}
              y2={y}
              stroke={twColors.border}
              strokeWidth={borderWidth.default}
            />
          );
        })}

        {evolutionByMonth.map((monthData, monthIndex) => {
          const monthLeft = left + monthIndex * groupWidth + 4;
          return dimensionNames.map((dim, dimIndex) => {
            const value = Number(monthData[dim]);
            const h = (value / 100) * plotHeight;
            const x = monthLeft + dimIndex * (barWidth + barGap);
            const y = top + (plotHeight - h);

            return (
              <Rect
                key={`${String(monthData.mes)}-${dim}`}
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={2}
                fill={chartColors[dimIndex]}
                opacity={0.85}
              />
            );
          });
        })}
      </Svg>

      <View style={styles.monthsAxisRow}>
        {MONTHS.map((month) => (
          <Text key={`bar-${month}`} style={styles.axisText}>
            {month}
          </Text>
        ))}
      </View>
    </View>
  );
}

function MultiLineChart() {
  const width = 440;
  const height = 220;
  const left = 28;
  const right = 10;
  const top = 10;
  const bottom = 28;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const gridTicks = [0, 25, 50, 75, 100];

  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {gridTicks.map((tick) => {
          const y = top + (1 - tick / 100) * plotHeight;
          return (
            <Line
              key={`line-grid-${tick}`}
              x1={left}
              y1={y}
              x2={width - right}
              y2={y}
              stroke={twColors.border}
              strokeWidth={borderWidth.default}
            />
          );
        })}

        {dimensionNames.map((dim, dimIndex) => {
          const points = evolutionByMonth
            .map((monthData, monthIndex) => {
              const x =
                left + (monthIndex / (evolutionByMonth.length - 1)) * plotWidth;
              const value = Number(monthData[dim]);
              const y = top + (1 - value / 100) * plotHeight;
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <React.Fragment key={`line-${dim}`}>
              <Polyline
                points={points}
                fill="none"
                stroke={chartColors[dimIndex]}
                strokeWidth={2.5}
              />
              {evolutionByMonth.map((monthData, monthIndex) => {
                const x =
                  left +
                  (monthIndex / (evolutionByMonth.length - 1)) * plotWidth;
                const value = Number(monthData[dim]);
                const y = top + (1 - value / 100) * plotHeight;
                return (
                  <Circle
                    key={`${dim}-${String(monthData.mes)}`}
                    cx={x}
                    cy={y}
                    r={3.4}
                    fill={chartColors[dimIndex]}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.monthsAxisRow}>
        {MONTHS.map((month) => (
          <Text key={`line-${month}`} style={styles.axisText}>
            {month}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function Stats() {
  const router = useRouter();

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

          <Animated.View entering={FadeInUp.duration(450)}>
            <Text style={styles.title}>Estadisticas detalladas</Text>
            <Text style={styles.subtitle}>Tu evolucion completa mes a mes</Text>
          </Animated.View>

          <View style={styles.cardsGrid}>
            {statsCards.map((stat, index) => {
              const pct = Math.min(
                100,
                Math.round((stat.current / stat.goal) * 100),
              );
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
                          backgroundColor:
                            pct >= 100
                              ? twColors.primary
                              : `${twColors.primary}B3`,
                        },
                      ]}
                    />
                  </View>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View
            entering={FadeInDown.delay(420).duration(400)}
            style={styles.chartCard}
          >
            <Text style={styles.chartTitle}>Progreso por dimension</Text>
            <GroupedBarsChart />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(520).duration(400)}
            style={styles.chartCard}
          >
            <Text style={styles.chartTitle}>Evolucion mensual</Text>
            <MultiLineChart />
            <View style={styles.legendWrap}>
              {dimensionNames.map((dim, index) => (
                <View key={dim} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: chartColors[index] },
                    ]}
                  />
                  <Text style={styles.legendText}>{dim}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: twColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 24,
  },
  content: {
    width: "100%",
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 96,
    gap: 14,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  backText: {
    fontSize: 13,
    fontFamily: twFonts.medium,
    color: twColors.primary,
  },
  title: {
    fontSize: 30,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    marginBottom: 6,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "48.5%",
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 14,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: twFonts.regular,
    color: twColors.mutedForeground,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  cardChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  cardChange: {
    fontSize: 12,
    fontFamily: twFonts.medium,
    color: twColors.primary,
  },
  goalRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 11,
    fontFamily: twFonts.regular,
    color: twColors.mutedForeground,
  },
  progressTrack: {
    marginTop: 6,
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: twColors.secondary,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  chartCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  monthsAxisRow: {
    marginTop: -2,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  axisText: {
    fontSize: 11,
    fontFamily: twFonts.regular,
    color: twColors.mutedForeground,
  },
  legendWrap: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    fontFamily: twFonts.medium,
    color: twColors.mutedForeground,
  },
});
