import { useFocusEffect } from '@react-navigation/native';
import { goBack } from '@/utils/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
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
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import {
  deleteBodyWeightEntry,
  getBodyWeightEntries,
  saveBodyWeightEntry,
} from '@/services/storage';
import { BodyWeightEntry } from '@/types';
import { generateId, parseWeight } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

const CHART_W = 320;
const CHART_H = 140;
const PAD = 16;

function BodyWeightChart({ entries }: { entries: BodyWeightEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.date - b.date).slice(-20);
  if (sorted.length < 2) return null;

  const weights = sorted.map((e) => e.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;

  const toX = (i: number) =>
    PAD + (i / (sorted.length - 1)) * (CHART_W - 2 * PAD);
  const toY = (w: number) =>
    PAD + ((maxW - w) / (maxW - minW)) * (CHART_H - 2 * PAD);

  const points = sorted.map((e, i) => `${toX(i)},${toY(e.weight)}`).join(' ');
  const last = sorted[sorted.length - 1];

  return (
    <View style={styles.chartWrapper}>
      <Svg width={CHART_W} height={CHART_H}>
        <Line x1={PAD} y1={PAD} x2={PAD} y2={CHART_H - PAD} stroke={twColors.border} strokeWidth={1} />
        <Line x1={PAD} y1={CHART_H - PAD} x2={CHART_W - PAD} y2={CHART_H - PAD} stroke={twColors.border} strokeWidth={1} />
        <Polyline points={points} fill="none" stroke={twColors.primary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {sorted.map((e, i) => (
          <Circle key={e.id} cx={toX(i)} cy={toY(e.weight)} r={i === sorted.length - 1 ? 5 : 3} fill={twColors.primary} />
        ))}
        <SvgText x={toX(sorted.length - 1)} y={toY(last.weight) - 10} fontSize={11} fill={twColors.primary} textAnchor="middle" fontWeight="bold">
          {last.weight} kg
        </SvgText>
      </Svg>
    </View>
  );
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={mStyles.overlay}>
        <View style={mStyles.card}>
          <Text style={mStyles.title}>{title}</Text>
          <Text style={mStyles.message}>{message}</Text>
          <View style={mStyles.btnRow}>
            <Pressable style={mStyles.cancelBtn} onPress={onCancel}>
              <Text style={mStyles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable style={mStyles.deleteBtn} onPress={onConfirm}>
              <Text style={mStyles.deleteText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function BodyWeightTracker() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getBodyWeightEntries().then(setEntries);
    }, [])
  );

  const handleWeightChange = (v: string) => {
    setWeightInput(v);
    if (inputError) setInputError(null);
  };

  const handleAdd = async () => {
    const w = parseWeight(weightInput);
    if (w <= 0) {
      setInputError('Ingresá un peso mayor a 0.');
      return;
    }
    const entry: BodyWeightEntry = {
      id: generateId(),
      date: Date.now(),
      weight: w,
      notes: notesInput.trim() || undefined,
    };
    await saveBodyWeightEntry(entry);
    setWeightInput('');
    setNotesInput('');
    setInputError(null);
    getBodyWeightEntries().then(setEntries);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteBodyWeightEntry(deleteTarget);
    setDeleteTarget(null);
    getBodyWeightEntries().then(setEntries);
  };

  const latest = entries[0];
  const oldest = entries.length > 1 ? entries[entries.length - 1] : null;
  const diff =
    latest && oldest ? (latest.weight - oldest.weight).toFixed(1) : null;

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
              <Pressable style={styles.backBtn} onPress={() => goBack('/profile')}>
                <ArrowLeft size={18} color={twColors.primary} />
              </Pressable>
              <Text style={styles.title}>Peso Corporal</Text>
            </View>

            {latest && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{latest.weight} kg</Text>
                  <Text style={styles.summaryLabel}>Último registro</Text>
                </View>
                {diff !== null && (
                  <View style={styles.summaryCard}>
                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color:
                            parseFloat(diff) < 0
                              ? '#4ade80'
                              : parseFloat(diff) > 0
                              ? twColors.destructive
                              : twColors.foreground,
                        },
                      ]}
                    >
                      {parseFloat(diff) > 0 ? '+' : ''}
                      {diff} kg
                    </Text>
                    <Text style={styles.summaryLabel}>vs. inicio</Text>
                  </View>
                )}
              </View>
            )}

            <BodyWeightChart entries={entries} />

            <View style={styles.addCard}>
              <Text style={styles.sectionTitle}>Nuevo registro</Text>
              <View style={styles.addRow}>
                <TextInput
                  value={weightInput}
                  onChangeText={handleWeightChange}
                  placeholder="Peso (kg)"
                  placeholderTextColor={twColors.muted}
                  keyboardType="decimal-pad"
                  style={[
                    styles.addInput,
                    { flex: 1 },
                    inputError ? styles.addInputError : null,
                  ]}
                  selectTextOnFocus
                />
                <TextInput
                  value={notesInput}
                  onChangeText={setNotesInput}
                  placeholder="Nota (opcional)"
                  placeholderTextColor={twColors.muted}
                  style={[styles.addInput, { flex: 2 }]}
                />
                <Pressable style={styles.addBtn} onPress={handleAdd}>
                  <Plus size={18} color={twColors.background} />
                </Pressable>
              </View>
              {inputError ? (
                <Text style={styles.inputErrorText}>{inputError}</Text>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Historial</Text>
            {entries.length === 0 && (
              <Text style={styles.emptyText}>Sin registros todavía</Text>
            )}
            {entries.map((e) => (
              <View key={e.id} style={styles.entryRow}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryWeight}>{e.weight} kg</Text>
                  {e.notes ? (
                    <Text style={styles.entryNote}>{e.notes}</Text>
                  ) : null}
                </View>
                <View style={styles.entryRight}>
                  <Text style={styles.entryDate}>
                    {new Date(e.date).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <Pressable onPress={() => setDeleteTarget(e.id)}>
                    <Trash2 size={14} color={twColors.muted} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <ConfirmModal
        visible={deleteTarget !== null}
        title="Eliminar registro"
        message="¿Querés eliminar esta entrada?"
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </KeyboardAvoidingView>
  );
}

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: twColors.card,
    borderRadius: twRadius.sm,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground },
  message: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.muted },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.destructive,
    alignItems: 'center',
  },
  deleteText: { fontSize: 14, fontFamily: twFonts.bold, color: '#fff' },
});

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
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: { fontSize: 22, fontFamily: twFonts.bold, color: twColors.foreground },
  summaryLabel: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted },
  chartWrapper: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 8,
    alignItems: 'center',
  },
  addCard: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 14,
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: {
    backgroundColor: twColors.background,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: twFonts.regular,
    color: twColors.foreground,
  },
  addInputError: {
    borderColor: twColors.destructive,
  },
  inputErrorText: {
    fontSize: 11,
    fontFamily: twFonts.medium,
    color: twColors.destructive,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: borderWidth.default,
    borderBottomColor: twColors.border,
  },
  entryLeft: { gap: 2 },
  entryWeight: { fontSize: 16, fontFamily: twFonts.bold, color: twColors.foreground },
  entryNote: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryDate: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.muted },
});
