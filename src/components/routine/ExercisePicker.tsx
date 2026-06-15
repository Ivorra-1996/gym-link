import { Check, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from '@/data/exerciseLibrary';
import { LibraryExercise } from '@/types';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

interface Props {
  visible: boolean;
  selectedIds: string[];
  onConfirm: (exercises: LibraryExercise[]) => void;
  onClose: () => void;
}

export default function ExercisePicker({ visible, selectedIds, onConfirm, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('Todos');
  const [picked, setPicked] = useState<Set<string>>(new Set(selectedIds));

  const groups = ['Todos', ...MUSCLE_GROUPS];

  const filtered = EXERCISE_LIBRARY.filter((e) => {
    const matchGroup = activeGroup === 'Todos' || e.muscleGroup === activeGroup;
    const matchQuery = e.name.toLowerCase().includes(query.toLowerCase());
    return matchGroup && matchQuery;
  });

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = EXERCISE_LIBRARY.filter((e) => picked.has(e.id));
    onConfirm(selected);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Ejercicios</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={twColors.foreground} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <Search size={14} color={twColors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar ejercicio..."
            placeholderTextColor={twColors.muted}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          horizontal
          data={groups}
          keyExtractor={(g) => g}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsRow}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveGroup(item)}
              style={[styles.groupPill, activeGroup === item && styles.groupPillActive]}
            >
              <Text
                style={[styles.groupText, activeGroup === item && styles.groupTextActive]}
              >
                {item}
              </Text>
            </Pressable>
          )}
          style={styles.groupsList}
        />

        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          style={styles.exerciseList}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const selected = picked.has(item.id);
            return (
              <Pressable
                style={[styles.exerciseRow, selected && styles.exerciseRowSelected]}
                onPress={() => toggle(item.id)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {item.muscleGroup} · {item.equipment}
                  </Text>
                </View>
                {selected && (
                  <View style={styles.checkCircle}>
                    <Check size={12} color={twColors.background} />
                  </View>
                )}
              </Pressable>
            );
          }}
        />

        <View style={styles.footer}>
          <Pressable
            style={[styles.confirmBtn, picked.size === 0 && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={picked.size === 0}
          >
            <Text style={styles.confirmBtnText}>
              Agregar {picked.size > 0 ? `(${picked.size})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: twColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontFamily: twFonts.bold, color: twColors.foreground },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: twColors.card2,
    borderRadius: twRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: twFonts.regular,
    color: twColors.foreground,
  },
  groupsList: { maxHeight: 44 },
  groupsRow: { paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  groupPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: 'transparent',
  },
  groupPillActive: { backgroundColor: twColors.primary },
  groupText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.mutedForeground },
  groupTextActive: { color: twColors.background },
  exerciseList: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
  },
  exerciseRowSelected: { borderColor: twColors.primary, backgroundColor: twColors.primary + '14' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.foreground },
  exerciseMeta: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted, marginTop: 2 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: twColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: borderWidth.default,
    borderTopColor: twColors.border,
  },
  confirmBtn: {
    backgroundColor: twColors.primary,
    borderRadius: twRadius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.background },
});
