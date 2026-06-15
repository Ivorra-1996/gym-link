import { router } from 'expo-router';
import { goBack } from '@/utils/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ArrowLeft, Save } from 'lucide-react-native';
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
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/services/firebase';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const [nombre, setNombre] = useState('');
  const [handle, setHandle] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setNombre(data.displayName ?? user?.name ?? '');
        setHandle(data.handle ?? '');
        setCiudad(data.ciudad ?? '');
      } else {
        setNombre(user?.name ?? '');
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const uid = auth.currentUser;
    if (!uid) return;
    const trimNombre = nombre.trim();
    if (!trimNombre) {
      Alert.alert('Falta el nombre', 'Ingresá tu nombre.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(uid, { displayName: trimNombre });
      await setDoc(
        doc(db, 'users', uid.uid),
        { displayName: trimNombre, handle: handle.trim(), ciudad: ciudad.trim() },
        { merge: true }
      );
      refreshUser();
      goBack('/(tabs)/profile');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Error al guardar', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={twColors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => goBack('/(tabs)/profile')}>
              <ArrowLeft size={18} color={twColors.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>Editar perfil</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                placeholderTextColor={twColors.muted}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Usuario (handle)</Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.inputPrefix}>@</Text>
                <TextInput
                  value={handle}
                  onChangeText={(v) => setHandle(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="tu_usuario"
                  placeholderTextColor={twColors.muted}
                  style={[styles.input, styles.inputFlex]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ciudad</Text>
              <TextInput
                value={ciudad}
                onChangeText={setCiudad}
                placeholder="Buenos Aires, Argentina"
                placeholderTextColor={twColors.muted}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={twColors.background} />
            ) : (
              <>
                <Save size={16} color={twColors.background} />
                <Text style={styles.saveBtnText}>Guardar cambios</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: twFonts.bold, color: twColors.foreground },
  form: { gap: 16 },
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
  inputWithPrefix: { flexDirection: 'row', alignItems: 'center' },
  inputPrefix: {
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: twRadius.sm,
    borderBottomLeftRadius: twRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: twFonts.regular,
    color: twColors.muted,
  },
  inputFlex: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  footer: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.background },
});
