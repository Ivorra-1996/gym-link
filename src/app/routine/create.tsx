import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  GripVertical,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ExercisePicker from '@/components/routine/ExercisePicker';
import { LibraryExercise, Routine, RoutineExercise } from '@/types';
import { deleteRoutine, getRoutines, saveRoutine } from '@/services/storage';
import { generateId } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

export default function CreateRoutine() {
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const isEditing = !!routineId;

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!routineId) return;
    getRoutines().then((all) => {
      const found = all.find((r) => r.id === routineId);
      if (found) {
        setName(found.name);
        setMuscleGroup(found.muscleGroup);
        setExercises(found.exercises);
      }
    });
  }, [routineId]);

  const handleAddExercises = (selected: LibraryExercise[]) => {
    const existing = new Set(exercises.map((e) => e.libraryId));
    const newOnes: RoutineExercise[] = selected
      .filter((e) => !existing.has(e.id))
      .map((e) => ({
        libraryId: e.id,
        name: e.name,
        sets: 3,
        reps: 10,
        weight: 0,
      }));
    setExercises((prev) => [...prev, ...newOnes]);
  };

  const updateExercise = (index: number, key: keyof RoutineExercise, value: string) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== index) return ex;
        const numVal = parseFloat(value.replace(',', '.')) || 0;
        return { ...ex, [key]: ['sets', 'reps', 'weight'].includes(key) ? numVal : value };
      })
    );
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Ponele un nombre a la rutina.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Sin ejercicios', 'Agregá al menos un ejercicio.');
      return;
    }
    const now = Date.now();
    const routine: Routine = {
      id: routineId ?? generateId(),
      name: name.trim(),
      muscleGroup: muscleGroup.trim() || 'General',
      exercises,
      createdAt: now,
      updatedAt: now,
    };
    setSaving(true);
    try {
      await saveRoutine(routine);
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la rutina. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!routineId) return;
    Alert.alert('Eliminar rutina', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteRoutine(routineId);
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Pressable style={styles.backBtn} onPress={() => router.back()}>
                <ArrowLeft size={18} color={twColors.primary} />
              </Pressable>
              <Text style={styles.headerTitle}>
                {isEditing ? 'Editar rutina' : 'Nueva rutina'}
              </Text>
              {isEditing && (
                <Pressable onPress={handleDelete}>
                  <Trash2 size={18} color={twColors.destructive} />
                </Pressable>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre de la rutina</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej: Push Day"
                placeholderTextColor={twColors.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Grupo muscular</Text>
              <TextInput
                value={muscleGroup}
                onChangeText={setMuscleGroup}
                placeholder="Ej: Pecho & Tríceps"
                placeholderTextColor={twColors.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.exercisesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Ejercicios ({exercises.length})
                </Text>
                <Pressable
                  style={styles.addExerciseBtn}
                  onPress={() => setPickerVisible(true)}
                >
                  <Plus size={14} color={twColors.background} />
                  <Text style={styles.addExerciseBtnText}>Agregar</Text>
                </Pressable>
              </View>

              {exercises.length === 0 && (
                <View style={styles.emptyExercises}>
                  <Text style={styles.emptyText}>
                    Tocá "Agregar" para incluir ejercicios
                  </Text>
                </View>
              )}

              {exercises.map((ex, i) => (
                <View key={`${ex.libraryId}_${i}`} style={styles.exerciseCard}>
                  <View style={styles.exerciseCardHeader}>
                    <GripVertical size={16} color={twColors.muted} />
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Pressable onPress={() => removeExercise(i)}>
                      <Minus size={16} color={twColors.destructive} />
                    </Pressable>
                  </View>
                  <View style={styles.exerciseFields}>
                    <View style={styles.exerciseField}>
                      <Text style={styles.fieldLabel}>Series</Text>
                      <TextInput
                        value={String(ex.sets)}
                        onChangeText={(v) => updateExercise(i, 'sets', v)}
                        keyboardType="numeric"
                        style={styles.fieldInput}
                        selectTextOnFocus
                      />
                    </View>
                    <View style={styles.exerciseField}>
                      <Text style={styles.fieldLabel}>Reps</Text>
                      <TextInput
                        value={String(ex.reps)}
                        onChangeText={(v) => updateExercise(i, 'reps', v)}
                        keyboardType="numeric"
                        style={styles.fieldInput}
                        selectTextOnFocus
                      />
                    </View>
                    <View style={styles.exerciseField}>
                      <Text style={styles.fieldLabel}>Peso (kg)</Text>
                      <TextInput
                        value={ex.weight > 0 ? String(ex.weight) : ''}
                        onChangeText={(v) => updateExercise(i, 'weight', v)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={twColors.muted}
                        style={styles.fieldInput}
                        selectTextOnFocus
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.saveFooter}>
          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={twColors.background} />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Guardar cambios' : 'Crear rutina'}
              </Text>
            )}
          </Pressable>
        </View>

        <ExercisePicker
          visible={pickerVisible}
          selectedIds={exercises.map((e) => e.libraryId)}
          onConfirm={handleAddExercises}
          onClose={() => setPickerVisible(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted },
  input: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: twFonts.regular,
    color: twColors.foreground,
  },
  exercisesSection: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: twColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: twRadius.sm,
  },
  addExerciseBtnText: {
    fontSize: 12,
    fontFamily: twFonts.bold,
    color: twColors.background,
  },
  emptyExercises: {
    padding: 24,
    alignItems: 'center',
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted },
  exerciseCard: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 14,
    gap: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    fontFamily: twFonts.medium,
    color: twColors.foreground,
  },
  exerciseFields: { flexDirection: 'row', gap: 10 },
  exerciseField: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: 10, fontFamily: twFonts.regular, color: twColors.muted },
  fieldInput: {
    backgroundColor: twColors.background,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    textAlign: 'center',
  },
  saveFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: twColors.background,
    borderTopWidth: borderWidth.default,
    borderTopColor: twColors.border,
  },
  saveBtn: {
    backgroundColor: twColors.primary,
    borderRadius: twRadius.sm,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.background },
});
