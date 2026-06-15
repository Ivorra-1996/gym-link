import { router } from 'expo-router';
import { goBack } from '@/utils/navigation';
import { deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  cancelAllNotifications,
  checkNotificationPermissions,
  enableNotifications,
  scheduleHydrationReminders,
} from '@/services/notifications';
import { getRoutines } from '@/services/storage';
import { Routine } from '@/types';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Droplets,
  LogOut,
  Mail,
  MapPin,
  Shield,
  Trash2,
  Users,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
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
  intervaloHidratacion: number;
};

const DEFAULT: SettingsData = {
  visibleEnMapa: false,
  buscarMatches: false,
  notificacionesActivas: false,
  intervaloHidratacion: 2,
};

type ActiveModal = 'signout' | 'password' | 'delete' | null;

// ── ConfirmModal ───────────────────────────────────────────────────────────────

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={mStyles.overlay}>
        <View style={mStyles.card}>
          <Text style={mStyles.title}>{title}</Text>
          <Text style={mStyles.message}>{message}</Text>
          {error ? <Text style={mStyles.error}>{error}</Text> : null}
          <View style={mStyles.btnRow}>
            <Pressable style={mStyles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={mStyles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[mStyles.confirmBtn, destructive && mStyles.destructiveBtn, loading && mStyles.btnDisabled]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={destructive ? '#fff' : twColors.background} />
              ) : (
                <Text style={[mStyles.confirmText, destructive && mStyles.destructiveText]}>
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<SettingsData>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const uid = auth.currentUser?.uid;
  const isPasswordProvider = auth.currentUser?.providerData.some(
    (p) => p.providerId === 'password'
  );

  useEffect(() => {
    getRoutines().then(setRoutines);
  }, []);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const d = snap.data();
        let notificacionesActivas = d.notificacionesActivas ?? false;

        if (notificacionesActivas) {
          const stillGranted = await checkNotificationPermissions();
          if (!stillGranted) {
            notificacionesActivas = false;
            setDoc(doc(db, 'users', uid), { notificacionesActivas: false }, { merge: true }).catch(() => {});
          }
        }

        setSettings({
          visibleEnMapa: d.visibleEnMapa ?? false,
          buscarMatches: d.buscarMatches ?? false,
          notificacionesActivas,
          intervaloHidratacion: d.intervaloHidratacion ?? 2,
        });
      }
      setLoading(false);
    })();
  }, [uid]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const openModal = useCallback((type: ActiveModal) => {
    setModalError(null);
    setModalLoading(false);
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalLoading(false);
    setModalError(null);
  }, []);

  const toggle = async (key: keyof SettingsData, value: boolean) => {
    if (!uid) return;

    if (key === 'notificacionesActivas') {
      setSavingKey(key);
      if (value) {
        const granted = await enableNotifications(routines, settings.intervaloHidratacion);
        if (!granted) {
          setSavingKey(null);
          setToast('Permisos denegados. Activá las notificaciones en Configuración del sistema.');
          return;
        }
        setSettings((s) => ({ ...s, notificacionesActivas: true }));
        setToast('Notificaciones activadas ✓');
      } else {
        await cancelAllNotifications();
        setSettings((s) => ({ ...s, notificacionesActivas: false }));
      }
      try {
        await setDoc(doc(db, 'users', uid), { notificacionesActivas: value }, { merge: true });
      } catch {
        setToast('No se pudo guardar el cambio.');
      } finally {
        setSavingKey(null);
      }
      return;
    }

    const prev = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSavingKey(key);
    try {
      await setDoc(doc(db, 'users', uid), { [key]: value }, { merge: true });
    } catch {
      setSettings(prev);
      setToast('No se pudo guardar el cambio.');
    } finally {
      setSavingKey(null);
    }
  };

  const setIntervalHydration = async (hours: number) => {
    if (!uid) return;
    setSettings((s) => ({ ...s, intervaloHidratacion: hours }));
    setSavingKey('intervaloHidratacion');
    if (settings.notificacionesActivas) {
      await scheduleHydrationReminders(hours);
    }
    try {
      await setDoc(doc(db, 'users', uid), { intervaloHidratacion: hours }, { merge: true });
    } catch {
      setToast('No se pudo guardar el cambio.');
    } finally {
      setSavingKey(null);
    }
  };

  const handlePasswordResetConfirm = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      closeModal();
      setToast('Email enviado. Revisá tu bandeja de entrada.');
    } catch {
      setModalError('No se pudo enviar el email. Intentá de nuevo.');
      setModalLoading(false);
    }
  };

  const handleSignOutConfirm = async () => {
    closeModal();
    await signOut();
  };

  const handleDeleteConfirm = async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await deleteUser(fbUser);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/requires-recent-login') {
        setModalError('Cerrá sesión, volvé a ingresar y luego intentá de nuevo.');
      } else {
        setModalError('No se pudo eliminar la cuenta. Intentá de nuevo.');
      }
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={twColors.primary} />
      </View>
    );
  }

  const email = auth.currentUser?.email ?? '';

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => goBack('/profile')}>
            <ArrowLeft size={18} color={twColors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Configuración</Text>
        </View>

        {/* Cuenta */}
        <Section title="Cuenta">
          <InfoRow label="Email" value={user?.email ?? '—'} icon={Mail} />
          {isPasswordProvider ? (
            <ActionRow label="Cambiar contraseña" icon={Shield} onPress={() => openModal('password')} />
          ) : (
            <InfoRow label="Contraseña" value="Gestionada por Google" icon={Shield} />
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

        {/* Notificaciones — solo nativo */}
        {Platform.OS !== 'web' && (
          <Section title="Notificaciones">
            <ToggleRow
              label="Notificaciones"
              sublabel="Recordatorios de entrenamiento e hidratación"
              icon={Bell}
              value={settings.notificacionesActivas}
              loading={savingKey === 'notificacionesActivas'}
              onValueChange={(v) => toggle('notificacionesActivas', v)}
            />
            {settings.notificacionesActivas && (
              <IntervalRow
                value={settings.intervaloHidratacion}
                loading={savingKey === 'intervaloHidratacion'}
                onChange={setIntervalHydration}
              />
            )}
          </Section>
        )}

        {/* Sesión */}
        <Section title="Sesión">
          <ActionRow
            label="Cerrar sesión"
            icon={LogOut}
            onPress={() => openModal('signout')}
          />
        </Section>

        {/* Zona peligrosa */}
        <Section title="Zona peligrosa">
          <ActionRow
            label="Eliminar cuenta"
            icon={Trash2}
            destructive
            onPress={() => openModal('delete')}
          />
        </Section>
      </ScrollView>

      {/* Toast */}
      {toast ? (
        <View style={mStyles.toast}>
          <Text style={mStyles.toastText}>{toast}</Text>
        </View>
      ) : null}

      {/* Modales */}
      <ConfirmModal
        visible={activeModal === 'signout'}
        title="Cerrar sesión"
        message="¿Estás seguro que querés cerrar sesión?"
        confirmLabel="Cerrar sesión"
        destructive
        loading={modalLoading}
        error={modalError}
        onConfirm={handleSignOutConfirm}
        onCancel={closeModal}
      />

      <ConfirmModal
        visible={activeModal === 'password'}
        title="Cambiar contraseña"
        message={`Te enviaremos un link de restablecimiento a ${email}`}
        confirmLabel="Enviar email"
        loading={modalLoading}
        error={modalError}
        onConfirm={handlePasswordResetConfirm}
        onCancel={closeModal}
      />

      <ConfirmModal
        visible={activeModal === 'delete'}
        title="Eliminar cuenta"
        message="Esta acción es permanente. Se eliminarán tu cuenta y todos tus datos."
        confirmLabel="Eliminar"
        destructive
        loading={modalLoading}
        error={modalError}
        onConfirm={handleDeleteConfirm}
        onCancel={closeModal}
      />
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

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: IconComponent }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={15} color={twColors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{value}</Text>
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

const INTERVAL_OPTIONS = [1, 2, 3, 4];

function IntervalRow({
  value,
  loading,
  onChange,
}: {
  value: number;
  loading: boolean;
  onChange: (h: number) => void;
}) {
  return (
    <View style={[styles.row, { flexWrap: 'wrap', rowGap: 8 }]}>
      <View style={styles.rowIcon}>
        <Droplets size={15} color={twColors.muted} />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={styles.rowLabel}>Recordatorio de agua</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {INTERVAL_OPTIONS.map((h) => (
            <Pressable
              key={h}
              onPress={() => onChange(h)}
              style={[styles.chip, value === h && styles.chipActive]}
            >
              <Text style={[styles.chipText, value === h && styles.chipTextActive]}>
                {h}h
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {loading && <ActivityIndicator size="small" color={twColors.primary} />}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

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
  error: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.destructive },
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
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.background },
  destructiveBtn: { backgroundColor: twColors.destructive },
  destructiveText: { color: '#fff' },
  btnDisabled: { opacity: 0.7 },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.primary,
    borderRadius: twRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toastText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.foreground },
});

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
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
  },
  chipActive: {
    backgroundColor: twColors.primary,
    borderColor: twColors.primary,
  },
  chipText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.muted },
  chipTextActive: { color: twColors.background },
});
