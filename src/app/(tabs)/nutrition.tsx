import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Target, Trash2, Utensils } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  DEFAULT_NUTRITION_GOALS,
  getNutritionGoals,
  getTodayNutritionEntries,
  saveTodayNutritionEntries,
  setNutritionGoals,
  syncNutritionLog,
} from '@/services/storage';
import { FoodEntry, NutritionGoals } from '@/types';
import { goBack } from '@/utils/navigation';
import { borderWidth, twColors, twFonts, twRadius } from '@/constants/tailwind-runtime-theme';

// ── Constantes ────────────────────────────────────────────────────────────────

const MACRO_COLORS = {
  protein: '#3b82f6',
  carbs: '#eab308',
  fat: '#f97316',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, max: number): number {
  return Math.min(Math.max(v, 0), max);
}

function pct(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return clamp((value / goal) * 100, 100);
}

function todayLabel(): string {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function MacroBar({ color, value, goal, label }: {
  color: string; value: number; goal: number; label: string;
}) {
  const filled = pct(value, goal);
  return (
    <View style={macroBarStyles.wrap}>
      <View style={macroBarStyles.header}>
        <Text style={macroBarStyles.label}>{label}</Text>
        <Text style={macroBarStyles.value}>{value}g</Text>
      </View>
      <View style={macroBarStyles.track}>
        <View style={[macroBarStyles.fill, { width: `${filled}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={macroBarStyles.goal}>/{goal}g</Text>
    </View>
  );
}

const macroBarStyles = StyleSheet.create({
  wrap: { flex: 1, gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 11, fontFamily: twFonts.medium, color: twColors.muted },
  value: { fontSize: 13, fontFamily: twFonts.bold, color: twColors.foreground },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: twColors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 999 },
  goal: { fontSize: 10, fontFamily: twFonts.regular, color: twColors.muted },
});

// ── Pantalla principal ─────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', calories: '', protein: '', carbs: '', fat: '' };

export default function NutritionScreen() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_NUTRITION_GOALS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [goalsForm, setGoalsForm] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getTodayNutritionEntries(), getNutritionGoals()]).then(
        ([e, g]) => { setEntries(e); setGoals(g); }
      );
    }, [])
  );

  const totals = useMemo(
    () => entries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein:  acc.protein  + e.protein,
        carbs:    acc.carbs    + e.carbs,
        fat:      acc.fat      + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    ),
    [entries],
  );

  const calPct = pct(totals.calories, goals.calories);
  const calRemaining = Math.max(0, goals.calories - totals.calories);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const persistEntries = async (next: FoodEntry[]) => {
    setEntries(next);
    await saveTodayNutritionEntries(next);
    syncNutritionLog(next, goals).catch(() => {});
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingEntry(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openEdit = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setForm({
      name:     entry.name,
      calories: String(entry.calories),
      protein:  String(entry.protein),
      carbs:    String(entry.carbs),
      fat:      String(entry.fat),
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleAdd = async () => {
    const name = form.name.trim();
    const cal = parseInt(form.calories, 10);
    if (!name) { setFormError('El nombre es obligatorio.'); return; }
    if (!form.calories || isNaN(cal) || cal <= 0) {
      setFormError('Ingresá las calorías.');
      return;
    }
    const updated: FoodEntry = {
      id:       editingEntry?.id ?? newId(),
      addedAt:  editingEntry?.addedAt ?? Date.now(),
      name,
      calories: cal,
      protein:  parseFloat(form.protein) || 0,
      carbs:    parseFloat(form.carbs)   || 0,
      fat:      parseFloat(form.fat)     || 0,
    };
    if (editingEntry) {
      await persistEntries(entries.map((e) => (e.id === editingEntry.id ? updated : e)));
    } else {
      await persistEntries([...entries, updated]);
    }
    closeAddModal();
  };

  const handleDelete = async (id: string) => {
    await persistEntries(entries.filter((e) => e.id !== id));
  };

  const handleSaveGoals = async () => {
    const cal  = parseInt(goalsForm.calories, 10);
    const prot = parseInt(goalsForm.protein, 10);
    const carb = parseInt(goalsForm.carbs, 10);
    const fat  = parseInt(goalsForm.fat, 10);
    if ([cal, prot, carb, fat].some((v) => isNaN(v) || v <= 0)) {
      setGoalsError('Completá todos los campos con valores mayores a 0.');
      return;
    }
    const next: NutritionGoals = { calories: cal, protein: prot, carbs: carb, fat };
    setGoals(next);
    await setNutritionGoals(next);
    syncNutritionLog(entries, next).catch(() => {});
    setGoalsError(null);
    setShowGoalsModal(false);
  };

  const openGoalsModal = () => {
    setGoalsForm({
      calories: String(goals.calories),
      protein:  String(goals.protein),
      carbs:    String(goals.carbs),
      fat:      String(goals.fat),
    });
    setGoalsError(null);
    setShowGoalsModal(true);
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => goBack('/profile')}>
              <ArrowLeft size={18} color={twColors.primary} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Nutrición</Text>
              <Text style={styles.subtitle}>{todayLabel()}</Text>
            </View>
            <Pressable style={styles.iconBtn} onPress={openGoalsModal}>
              <Target size={18} color={twColors.foreground} />
            </Pressable>
          </View>

          {/* Calorías */}
          <Animated.View entering={FadeInUp.delay(60)} style={styles.calCard}>
            <View style={styles.calHeader}>
              <Utensils size={14} color={twColors.primary} />
              <Text style={styles.calTitle}>Calorías</Text>
            </View>

            <View style={styles.calNumberRow}>
              <Text style={styles.calConsumed}>
                {totals.calories.toLocaleString('es-AR')}
              </Text>
              <Text style={styles.calGoal}>
                {' '}/ {goals.calories.toLocaleString('es-AR')} kcal
              </Text>
            </View>

            <View style={styles.calBarBg}>
              <View
                style={[
                  styles.calBarFill,
                  { width: `${calPct}%` as any },
                  calPct >= 100 && styles.calBarOverflow,
                ]}
              />
            </View>

            <Text style={styles.calRemaining}>
              {calPct >= 100
                ? `${(totals.calories - goals.calories).toLocaleString('es-AR')} kcal de exceso`
                : `${calRemaining.toLocaleString('es-AR')} kcal restantes`}
            </Text>
          </Animated.View>

          {/* Macros */}
          <Animated.View entering={FadeInUp.delay(120)} style={styles.macrosCard}>
            <MacroBar color={MACRO_COLORS.protein} value={totals.protein} goal={goals.protein} label="Proteínas" />
            <View style={styles.macroDivider} />
            <MacroBar color={MACRO_COLORS.carbs}   value={totals.carbs}   goal={goals.carbs}   label="Carbohidratos" />
            <View style={styles.macroDivider} />
            <MacroBar color={MACRO_COLORS.fat}     value={totals.fat}     goal={goals.fat}     label="Grasas" />
          </Animated.View>

          {/* Comidas de hoy */}
          <Animated.View entering={FadeInUp.delay(180)} style={styles.mealsSection}>
            <View style={styles.mealsSectionHeader}>
              <Text style={styles.sectionTitle}>Comidas de hoy</Text>
              <Pressable style={styles.addBtn} onPress={() => { setEditingEntry(null); setForm(EMPTY_FORM); setFormError(null); setShowAddModal(true); }}>
                <Plus size={14} color={twColors.background} />
                <Text style={styles.addBtnText}>Agregar</Text>
              </Pressable>
            </View>

            {entries.length === 0 ? (
              <View style={styles.empty}>
                <Utensils size={36} color={twColors.muted} />
                <Text style={styles.emptyTitle}>Sin comidas registradas</Text>
                <Text style={styles.emptySub}>Agregá tu primera comida para ver tu progreso</Text>
              </View>
            ) : (
              <View style={styles.entriesList}>
                {entries.map((e) => (
                  <Pressable key={e.id} style={styles.entryCard} onPress={() => openEdit(e)}>
                    <View style={styles.entryMain}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryName} numberOfLines={1}>{e.name}</Text>
                        <Text style={styles.entryMacros}>
                          P: {e.protein}g · C: {e.carbs}g · G: {e.fat}g
                        </Text>
                      </View>
                      <View style={styles.entryRight}>
                        <Text style={styles.entryCal}>{e.calories} kcal</Text>
                        <Pressable
                          style={styles.deleteBtn}
                          onPress={(ev) => { ev.stopPropagation?.(); setConfirmDeleteId(e.id); }}
                          hitSlop={10}
                        >
                          <Trash2 size={15} color={twColors.destructive} />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* ── Modal: agregar comida ── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          style={styles.modalKAV}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeAddModal} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingEntry ? 'Editar comida' : 'Agregar comida'}
            </Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Nombre *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ej: Pollo a la plancha"
                placeholderTextColor={twColors.muted}
                value={form.name}
                onChangeText={(v) => { setForm((f) => ({ ...f, name: v })); setFormError(null); }}
                autoCapitalize="sentences"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Calorías *</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="320"
                  placeholderTextColor={twColors.muted}
                  value={form.calories}
                  onChangeText={(v) => { setForm((f) => ({ ...f, calories: v })); setFormError(null); }}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Proteínas (g)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="0"
                  placeholderTextColor={twColors.muted}
                  value={form.protein}
                  onChangeText={(v) => setForm((f) => ({ ...f, protein: v }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Carbohidratos (g)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="0"
                  placeholderTextColor={twColors.muted}
                  value={form.carbs}
                  onChangeText={(v) => setForm((f) => ({ ...f, carbs: v }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Grasas (g)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="0"
                  placeholderTextColor={twColors.muted}
                  value={form.fat}
                  onChangeText={(v) => setForm((f) => ({ ...f, fat: v }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {formError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <Pressable style={styles.modalSubmitBtn} onPress={handleAdd}>
              <Text style={styles.modalSubmitText}>
                {editingEntry ? 'Guardar cambios' : 'Agregar'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: metas diarias ── */}
      <Modal
        visible={showGoalsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalKAV}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowGoalsModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Metas diarias</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Calorías diarias</Text>
              <View style={styles.fieldSuffix}>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputSuffix]}
                  placeholder="2000"
                  placeholderTextColor={twColors.muted}
                  value={goalsForm.calories}
                  onChangeText={(v) => { setGoalsForm((f) => ({ ...f, calories: v })); setGoalsError(null); }}
                  keyboardType="numeric"
                  autoFocus
                />
                <Text style={styles.suffixText}>kcal</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Proteínas</Text>
                <View style={styles.fieldSuffix}>
                  <TextInput
                    style={[styles.fieldInput, styles.fieldInputSuffix]}
                    placeholder="150"
                    placeholderTextColor={twColors.muted}
                    value={goalsForm.protein}
                    onChangeText={(v) => { setGoalsForm((f) => ({ ...f, protein: v })); setGoalsError(null); }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.suffixText}>g</Text>
                </View>
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Carbohidratos</Text>
                <View style={styles.fieldSuffix}>
                  <TextInput
                    style={[styles.fieldInput, styles.fieldInputSuffix]}
                    placeholder="220"
                    placeholderTextColor={twColors.muted}
                    value={goalsForm.carbs}
                    onChangeText={(v) => { setGoalsForm((f) => ({ ...f, carbs: v })); setGoalsError(null); }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.suffixText}>g</Text>
                </View>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Grasas</Text>
              <View style={styles.fieldSuffix}>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputSuffix]}
                  placeholder="70"
                  placeholderTextColor={twColors.muted}
                  value={goalsForm.fat}
                  onChangeText={(v) => { setGoalsForm((f) => ({ ...f, fat: v })); setGoalsError(null); }}
                  keyboardType="numeric"
                />
                <Text style={styles.suffixText}>g</Text>
              </View>
            </View>

            {goalsError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{goalsError}</Text>
              </View>
            ) : null}

            <Pressable style={styles.modalSubmitBtn} onPress={handleSaveGoals}>
              <Text style={styles.modalSubmitText}>Guardar metas</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: confirmar eliminación ── */}
      <Modal
        visible={confirmDeleteId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteId(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>¿Eliminar comida?</Text>
            <Text style={styles.confirmMsg}>
              {entries.find((e) => e.id === confirmDeleteId)?.name ?? ''}
            </Text>
            <View style={styles.confirmBtnRow}>
              <Pressable
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmDeleteId(null)}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.confirmDeleteBtn}
                onPress={async () => {
                  if (confirmDeleteId) await handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
              >
                <Text style={styles.confirmDeleteText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 16,
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2 as string,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontFamily: twFonts.bold, color: twColors.foreground },
  subtitle: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted, marginTop: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2 as string,
    borderWidth: 1,
    borderColor: twColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Calorías card
  calCard: {
    backgroundColor: twColors.card,
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.md,
    padding: 18,
    gap: 10,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calTitle: { flex: 1, fontSize: 12, fontFamily: twFonts.bold, color: twColors.foreground },
  calNumberRow: { flexDirection: 'row', alignItems: 'baseline' },
  calConsumed: { fontSize: 32, fontFamily: twFonts.bold, color: twColors.primary },
  calGoal: { fontSize: 14, fontFamily: twFonts.regular, color: twColors.muted },
  calBarBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: twColors.border,
    overflow: 'hidden',
  },
  calBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: twColors.primary,
  },
  calBarOverflow: { backgroundColor: twColors.destructive },
  calRemaining: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted },

  // Macros card
  macrosCard: {
    backgroundColor: twColors.card,
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.md,
    padding: 18,
    flexDirection: 'row',
    gap: 0,
  },
  macroDivider: {
    width: 1,
    backgroundColor: twColors.border,
    marginHorizontal: 14,
  },

  // Meals section
  mealsSection: { gap: 12 },
  mealsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: twColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: twRadius.sm,
  },
  addBtnText: { fontSize: 13, fontFamily: twFonts.bold, color: twColors.background },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.md,
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.foreground },
  emptySub: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.muted, textAlign: 'center', lineHeight: 18 },

  // Entries list
  entriesList: {
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.md,
    overflow: 'hidden',
  },
  entryCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: twColors.border,
    backgroundColor: twColors.card,
  },
  entryMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryName: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground },
  entryMacros: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted, marginTop: 2 },
  entryRight: { alignItems: 'flex-end', gap: 8 },
  entryCal: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.primary },
  deleteBtn: { padding: 4 },

  // Modal
  modalKAV: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: twColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: twColors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontFamily: twFonts.bold, color: twColors.foreground },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted },
  fieldInput: {
    backgroundColor: twColors.background,
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: twFonts.regular,
    color: twColors.foreground,
  },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: twColors.background,
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingRight: 12,
    overflow: 'hidden',
  },
  fieldInputSuffix: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' },
  suffixText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.muted },
  errorBox: {
    backgroundColor: twColors.destructive + '18',
    borderWidth: 1,
    borderColor: twColors.destructive + '50',
    borderRadius: twRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.destructive },
  modalSubmitBtn: {
    backgroundColor: twColors.primary,
    borderRadius: twRadius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalSubmitText: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.background },

  // Confirm delete modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  confirmCard: {
    backgroundColor: twColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: twColors.border,
    padding: 24,
    gap: 8,
  },
  confirmTitle: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground },
  confirmMsg: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, marginBottom: 8 },
  confirmBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2 as string,
    borderWidth: 1,
    borderColor: twColors.border,
    alignItems: 'center',
  },
  confirmCancelText: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.muted },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.destructive,
    alignItems: 'center',
  },
  confirmDeleteText: { fontSize: 14, fontFamily: twFonts.bold, color: '#ffffff' },
});
