import { router } from 'expo-router';
import { deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  Shield,
  Trash2,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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

type SettingsData = {
  visibleEnMapa: boolean;
  buscarMatches: boolean;
  notificacionesActivas: boolean;
};

const DEFAULT: SettingsData = {
  visibleEnMapa: false,
  buscarMatches: false,
  notificacionesActivas: false,
};

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<SettingsData>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const uid = auth.currentUser?.uid;
  const isPasswordProvider = auth.currentUser?.providerData.some(
    (p) => p.providerId === 'password'
  );

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSettings({
          visibleEnMapa: d.visibleEnMapa ?? false,
          buscarMatches: d.buscarMatches ?? false,
          notificacionesActivas: d.notificacionesActivas ?? false,
        });
      }
      setLoading(false);
    });
  }, [uid]);

  const toggle = async (key: keyof SettingsData, value: boolean) => {
    if (!uid) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSavingKey(key);
    try {
      await setDoc(doc(db, 'users', uid), { [key]: value }, { merge: true });
    } catch {
      setSettings(settings);
      Alert.alert('Error', 'No se pudo guardar el cambio.');
    } finally {
      setSavingKey(null);
    }
  };

  const handlePasswordReset = () => {
    const email = auth.currentUser?.email;
    if (!email) return;
    Alert.alert(
      'Cambiar contraseña',
      `Te enviaremos un link de restablecimiento a ${email}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar email',
          onPress: () => {
            sendPasswordResetEmail(auth, email)
              .then(() => Alert.alert('Email enviado', 'Revisá tu bandeja de entrada.'))
              .catch(() => Alert.alert('Error', 'No se pudo enviar el email.'));
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es permanente. Se eliminarán tu cuenta y todos tus datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const fbUser = auth.currentUser;
            if (!fbUser) return;
            deleteUser(fbUser).catch((err: { code?: string }) => {
              if (err.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Sesión expirada',
                  'Cerrá sesión, volvé a ingresar y luego intentá eliminar la cuenta.'
                );
              } else {
                Alert.alert('Error', 'No se pudo eliminar la cuenta.');
              }
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={twColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={twColors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Configuración</Text>
        </View>

        {/* Cuenta */}
        <Section title="Cuenta">
          <InfoRow label="Email" value={user?.email ?? '—'} icon={Mail} />
          {isPasswordProvider ? (
            <ActionRow label="Cambiar contraseña" icon={Shield} onPress={handlePasswordReset} />
          ) : (
            <InfoRow
              label="Contraseña"
              value="Gestionada por Google"
              icon={Shield}
            />
          )}
        </Section>

        {/* Privacidad */}
        <Section title="Privacidad">
          <ToggleRow
            label="Visible en el mapa"
            sublabel="Otros usuarios pueden encontrarte"
            icon={MapPin}
            value={settings.visibleEnMapa}
            loading={savingKey === 'visibleEnMapa'}
            onValueChange={(v) => toggle('visibleEnMapa', v)}
          />
          <ToggleRow
            label="Buscar compañeros"
            sublabel="Aparecer en sugerencias de match"
            icon={Users}
            value={settings.buscarMatches}
            loading={savingKey === 'buscarMatches'}
            onValueChange={(v) => toggle('buscarMatches', v)}
          />
        </Section>

        {/* Notificaciones */}
        <Section title="Notificaciones">
          <ToggleRow
            label="Notificaciones"
            sublabel="Recordatorios de entrenamiento e hidratación"
            icon={Bell}
            value={settings.notificacionesActivas}
            loading={savingKey === 'notificacionesActivas'}
            onValueChange={(v) => toggle('notificacionesActivas', v)}
          />
        </Section>

        {/* Sesión */}
        <Section title="Sesión">
          <ActionRow
            label="Cerrar sesión"
            icon={LogOut}
            onPress={() =>
              Alert.alert('Cerrar sesión', '¿Estás seguro?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
              ])
            }
          />
        </Section>

        {/* Zona peligrosa */}
        <Section title="Zona peligrosa">
          <ActionRow
            label="Eliminar cuenta"
            icon={Trash2}
            destructive
            onPress={handleDeleteAccount}
          />
        </Section>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

type IconComponent = React.ComponentType<{ size: number; color: string }>;

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: IconComponent;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={15} color={twColors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ActionRow({
  label,
  icon: Icon,
  destructive,
  onPress,
}: {
  label: string;
  icon: IconComponent;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, styles.rowPressable, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.rowIcon}>
        <Icon size={15} color={destructive ? twColors.destructive : twColors.muted} />
      </View>
      <Text style={[styles.rowLabel, destructive && { color: twColors.destructive }]}>
        {label}
      </Text>
      <ChevronRight size={14} color={destructive ? twColors.destructive : twColors.muted} />
    </Pressable>
  );
}

function ToggleRow({
  label,
  sublabel,
  icon: Icon,
  value,
  loading,
  onValueChange,
}: {
  label: string;
  sublabel: string;
  icon: IconComponent;
  value: boolean;
  loading: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={15} color={twColors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sublabel}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={twColors.primary} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: twColors.border, true: twColors.primary + '80' }}
          thumbColor={value ? twColors.primary : twColors.muted}
          ios_backgroundColor={twColors.border}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 48,
    gap: 24,
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
  headerTitle: { fontSize: 18, fontFamily: twFonts.bold, color: twColors.foreground },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: twFonts.medium,
    color: twColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: borderWidth.default,
    borderBottomColor: twColors.border,
  },
  rowPressable: {},
  rowPressed: { backgroundColor: twColors.card2 },
  rowIcon: { width: 28, alignItems: 'center' },
  rowLabel: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.foreground },
  rowSub: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted, marginTop: 1 },
});
