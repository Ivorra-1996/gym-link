import { Tabs, router } from 'expo-router';
import { Dumbbell, Home, Play, Search, User } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useWorkout } from '@/context/WorkoutContext';
import { formatDuration } from '@/utils/workout';
import { twColors, twFonts, borderWidth, twRadius } from '@/constants/tailwind-runtime-theme';

function SessionBanner() {
  const { session } = useWorkout();
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.startedAt]);

  if (!session) return null;

  return (
    <Pressable
      style={styles.sessionBanner}
      onPress={() => router.push('/workout/active' as never)}
    >
      <View style={styles.sessionBannerLeft}>
        <View style={styles.sessionPulse} />
        <Text style={styles.sessionBannerName} numberOfLines={1}>
          {session.routineName}
        </Text>
      </View>
      <Text style={styles.sessionBannerTime}>{formatDuration(elapsed)}</Text>
      <View style={styles.sessionBannerBtn}>
        <Play size={12} color={twColors.background} />
        <Text style={styles.sessionBannerBtnText}>Continuar</Text>
      </View>
    </Pressable>
  );
}

function SessionRecoveryModal() {
  const { session, endSession } = useWorkout();
  const [visible, setVisible] = React.useState(false);
  const shown = React.useRef(false);

  React.useEffect(() => {
    if (!session || shown.current) return;
    if (Date.now() - session.startedAt < 60_000) return;
    shown.current = true;
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [session]);

  if (!session || !visible) return null;

  const handleDiscard = () => { setVisible(false); endSession(); };
  const handleContinue = () => { setVisible(false); router.push('/workout/active' as never); };

  return (
    <Modal transparent visible onRequestClose={handleDiscard}>
      <View style={recoveryStyles.overlay}>
        <View style={recoveryStyles.card}>
          <View style={recoveryStyles.pulse} />
          <View style={recoveryStyles.textWrap}>
            <Text style={recoveryStyles.title}>Entrenamiento en progreso</Text>
            <Text style={recoveryStyles.message}>
              Tenés una sesión de "{session.routineName}" sin terminar.
            </Text>
          </View>
          <View style={recoveryStyles.btnRow}>
            <Pressable style={recoveryStyles.discardBtn} onPress={handleDiscard}>
              <Text style={recoveryStyles.discardText}>Descartar</Text>
            </Pressable>
            <Pressable style={recoveryStyles.continueBtn} onPress={handleContinue}>
              <Play size={13} color={twColors.background} />
              <Text style={recoveryStyles.continueText}>Continuar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: twColors.background,
            borderTopColor: twColors.border,
            borderTopWidth: 0.5,
          },
          tabBarActiveTintColor: twColors.primary,
          tabBarInactiveTintColor: twColors.muted,
          tabBarLabelStyle: {
            fontFamily: twFonts.medium,
            fontSize: 10,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen
          name="train"
          options={{
            title: 'Entrenar',
            tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Descubrir',
            tabBarIcon: ({ color, size }) => <Search color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen name="statistics" options={{ href: null }} />
        <Tabs.Screen name="stats" options={{ href: null }} />
      </Tabs>
      <SessionBanner />
      <SessionRecoveryModal />
    </View>
  );
}

const recoveryStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: twColors.card,
    borderRadius: 16,
    borderWidth: borderWidth.default,
    borderColor: twColors.primary,
    padding: 20,
    gap: 14,
  },
  pulse: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: twColors.primary,
  },
  textWrap: { gap: 4 },
  title: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.foreground },
  message: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 10 },
  discardBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
  },
  discardText: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.muted },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  continueText: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.background },
});

const styles = StyleSheet.create({
  sessionBanner: {
    position: 'absolute',
    bottom: 58,
    left: 12,
    right: 12,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: twColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sessionBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: twColors.primary,
  },
  sessionBannerName: {
    fontSize: 13,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    flex: 1,
  },
  sessionBannerTime: {
    fontSize: 13,
    fontFamily: twFonts.bold,
    color: twColors.primary,
  },
  sessionBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: twColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sessionBannerBtnText: {
    fontSize: 11,
    fontFamily: twFonts.bold,
    color: twColors.background,
  },
});
