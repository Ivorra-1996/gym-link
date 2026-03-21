import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from "../../constants/tailwind-runtime-theme";

("use client");

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: string;
}

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

export default function RoutinePage() {
  const params = useLocalSearchParams();
  const routineId = params.id as string;
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulación de fetch - reemplazar con tu API real
    const mockRoutine: Routine = {
      id: routineId,
      name: "Rutina de Pecho y Tríceps",
      description: "Rutina enfocada en desarrollo de pecho y tríceps",
      difficulty: "intermediate",
      exercises: [
        { id: "1", name: "Press de Banca", sets: 4, reps: 8, weight: "80kg" },
        {
          id: "2",
          name: "Flexiones",
          sets: 3,
          reps: 12,
          weight: "Peso corporal",
        },
        { id: "3", name: "Fondos", sets: 3, reps: 10, weight: "Peso corporal" },
      ],
    };
    setRoutine(mockRoutine);
    setLoading(false);
  }, [routineId]);

  if (loading)
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Cargando...</Text>
      </View>
    );
  if (!routine)
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Rutina no encontrada</Text>
      </View>
    );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Link href="/train" style={styles.backLink}>
            ← Volver
          </Link>

          <Text style={styles.title}>{routine.name}</Text>
          <Text style={styles.description}>{routine.description}</Text>
          <Text style={styles.difficultyBadge}>{routine.difficulty}</Text>

          <View style={styles.exerciseList}>
            <Text style={styles.exerciseListTitle}>Ejercicios</Text>
            {routine.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.exerciseMetaRow}>
                  <View style={styles.exerciseMetaItem}>
                    <Text style={styles.exerciseMetaLabel}>Series</Text>
                    <Text style={styles.exerciseMetaValue}>
                      {exercise.sets}
                    </Text>
                  </View>
                  <View style={styles.exerciseMetaItem}>
                    <Text style={styles.exerciseMetaLabel}>Repeticiones</Text>
                    <Text style={styles.exerciseMetaValue}>
                      {exercise.reps}
                    </Text>
                  </View>
                  <View style={styles.exerciseMetaItem}>
                    <Text style={styles.exerciseMetaLabel}>Peso</Text>
                    <Text style={styles.exerciseMetaValue}>
                      {exercise.weight}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
    gap: 20,
  },
  statusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: twColors.background,
  },
  statusText: {
    fontSize: 16,
    fontFamily: twFonts.medium,
    color: twColors.foreground,
  },
  backLink: {
    color: twColors.primary,
    fontSize: 14,
    fontFamily: twFonts.medium,
  },
  title: {
    fontSize: 20,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  description: {
    fontSize: 14,
    fontFamily: twFonts.regular,
    color: twColors.muted,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    backgroundColor: twColors.primary,
    color: twColors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: twRadius.sm,
    fontSize: 12,
    fontFamily: twFonts.medium,
    textTransform: "capitalize",
  },
  exerciseList: {
    gap: 12,
  },
  exerciseListTitle: {
    fontSize: 22,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    marginBottom: 8,
  },
  exerciseCard: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 16,
    gap: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  exerciseMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  exerciseMetaItem: {
    flex: 1,
  },
  exerciseMetaLabel: {
    fontSize: 12,
    fontFamily: twFonts.regular,
    color: twColors.muted,
  },
  exerciseMetaValue: {
    fontSize: 14,
    fontFamily: twFonts.medium,
    color: twColors.foreground,
    marginTop: 2,
  },
});
