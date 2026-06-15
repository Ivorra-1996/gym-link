import { router } from 'expo-router';
import { goBack } from '@/utils/navigation';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { calculate1RM, getPercentageTable, parseWeight } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

export default function Calculator() {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const w = parseWeight(weight);
  const r = parseInt(reps) || 0;
  const oneRM = w > 0 && r > 0 ? calculate1RM(w, r) : null;
  const table = oneRM ? getPercentageTable(oneRM) : [];

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
              <Text style={styles.title}>Calculadora 1RM</Text>
            </View>

            <Text style={styles.desc}>
              Ingresá el peso y las reps que levantaste para calcular tu máximo
              estimado (fórmula Epley).
            </Text>

            <View style={styles.inputsRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="80"
                  placeholderTextColor={twColors.muted}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  selectTextOnFocus
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Repeticiones</Text>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  placeholder="5"
                  placeholderTextColor={twColors.muted}
                  keyboardType="numeric"
                  style={styles.input}
                  selectTextOnFocus
                />
              </View>
            </View>

            {oneRM !== null && (
              <>
                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>1RM estimado</Text>
                  <Text style={styles.resultValue}>{oneRM} kg</Text>
                </View>

                <Text style={styles.tableTitle}>Tabla de porcentajes</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableCell, styles.tableHeaderCell]}>%</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell]}>Peso</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell]}>Reps aprox.</Text>
                  </View>
                  {table.map((row) => (
                    <View
                      key={row.pct}
                      style={[
                        styles.tableRow,
                        row.pct === 100 && styles.tableRowHighlight,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableCell,
                          row.pct === 100 && styles.tableCellHighlight,
                        ]}
                      >
                        {row.pct}%
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.tableCellBold,
                          row.pct === 100 && styles.tableCellHighlight,
                        ]}
                      >
                        {row.weight} kg
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          row.pct === 100 && styles.tableCellHighlight,
                        ]}
                      >
                        {row.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 40 },
  content: {
    width: '100%',
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    gap: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontFamily: twFonts.bold, color: twColors.foreground },
  desc: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, lineHeight: 20 },
  inputsRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1, gap: 6 },
  label: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.muted },
  input: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 22,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: twColors.primary + '1A',
    borderWidth: borderWidth.default,
    borderColor: twColors.primary,
    borderRadius: twRadius.sm,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  resultLabel: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.primary },
  resultValue: { fontSize: 40, fontFamily: twFonts.bold, color: twColors.primary },
  tableTitle: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground },
  table: {
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: borderWidth.default,
    borderBottomColor: twColors.border,
  },
  tableHeaderRow: { backgroundColor: twColors.card2 },
  tableRowHighlight: { backgroundColor: twColors.primary + '1A' },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: twFonts.regular,
    color: twColors.foreground,
    textAlign: 'center',
  },
  tableCellBold: { fontFamily: twFonts.bold },
  tableCellHighlight: { color: twColors.primary, fontFamily: twFonts.bold },
  tableHeaderCell: {
    fontSize: 11,
    fontFamily: twFonts.bold,
    color: twColors.muted,
    textTransform: 'uppercase',
  },
});
