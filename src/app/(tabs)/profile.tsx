import { useFocusEffect } from '@react-navigation/native';
import { Href, router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import {
  ChevronRight,
  Flame,
  Pencil,
  Settings,
  TrendingUp,
  Utensils,
  User,
  Zap,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AchievementDef } from '@/data/achievements';
import { WorkoutSession } from '@/types';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { ACHIEVEMENTS } from '@/data/achievements';
import { auth, db } from '@/services/firebase';
import { checkAndUnlock } from '@/services/achievements';
import { getSessions } from '@/services/storage';
import { calculateStreak } from '@/utils/workout';
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from '@/constants/tailwind-runtime-theme';

const menuItems = [
  { icon: TrendingUp, label: 'Estadísticas mensuales', count: '', href: '/statistics' },
  { icon: Utensils,   label: 'Nutrición',              count: '', href: '/nutrition' },
  { icon: Flame,      label: 'Peso Corporal',          count: '', href: '/tools/bodyweight' },
];

const Profile = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [streak, setStreak] = useState(0);
  const [handle, setHandle] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementDef | null>(null);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const uid = auth.currentUser?.uid;
      getSessions().then((loadedSessions) => {
        setSessions(loadedSessions);
        setTotalSessions(loadedSessions.length);
        setStreak(calculateStreak(loadedSessions));
        if (uid) {
          checkAndUnlock(uid, loadedSessions).then(setUnlockedIds);
        }
      });
      if (uid) {
        getDoc(doc(db, 'users', uid)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setHandle(data.handle ?? '');
            setCiudad(data.ciudad ?? '');
          }
        });
      }
    }, [])
  );

  const stats = [
    { value: String(totalSessions), label: 'Entrenos' },
    { value: streak > 0 ? String(streak) : '0', label: 'Racha' },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Perfil</Text>
            <Pressable
              style={styles.settingsButton}
              onPress={() => router.push('/settings' as Href)}
            >
              <Settings size={16} color={twColors.foreground} />
            </Pressable>
          </View>

          <Animated.View entering={FadeInUp.delay(50)} style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatarCircle}>
                <User size={24} color={twColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user?.name ?? 'Usuario'}</Text>
                <Text style={styles.profileSub}>
                  {handle ? `@${handle}` : ''}
                  {handle && ciudad ? ' · ' : ''}
                  {ciudad}
                  {!handle && !ciudad ? 'Completá tu perfil →' : ''}
                </Text>
              </View>
              <Pressable
                style={styles.editBtn}
                onPress={() => router.push('/profile/edit' as Href)}
              >
                <Pencil size={14} color={twColors.primary} />
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              {stats.map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(120)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Logros</Text>
              <Text style={styles.achievementCount}>
                {unlockedIds.size}/{ACHIEVEMENTS.length}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsRow}
            >
              {ACHIEVEMENTS.map((a) => {
                const unlocked = unlockedIds.has(a.id);
                return (
                  <Pressable
                    key={a.id}
                    style={[styles.achievementCard, !unlocked && styles.achievementCardLocked]}
                    onPress={() => setSelectedAchievement(a)}
                  >
                    <a.icon size={24} color={unlocked ? twColors.primary : twColors.muted} />
                    <Text style={[styles.achievementLabel, !unlocked && styles.achievementLabelLocked]}>
                      {a.name}
                    </Text>
                    <Text style={styles.achievementDesc} numberOfLines={2}>
                      {a.description}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180)} style={styles.menuList}>
            {menuItems.map((m) => (
              <Pressable
                key={m.label}
                style={[
                  styles.quickActionCard,
                  hoveredItem === m.label && styles.quickActionCardHovered,
                ]}
                onHoverIn={() => setHoveredItem(m.label)}
                onHoverOut={() => setHoveredItem(null)}
                onPress={() => {
                  if (m.href) router.push(m.href as Href);
                }}
              >
                <View style={styles.menuIconWrap}>
                  <m.icon size={16} color={twColors.primary} />
                </View>
                <Text style={styles.menuLabel}>{m.label}</Text>
                {m.count ? <Text style={styles.menuCount}>{m.count}</Text> : null}
                <ChevronRight size={14} color={twColors.muted} />
              </Pressable>
            ))}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Achievement detail modal */}
      <Modal
        visible={selectedAchievement !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedAchievement(null)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {selectedAchievement && (() => {
              const unlocked = unlockedIds.has(selectedAchievement.id);
              const prog = selectedAchievement.progress?.(sessions);
              const pct = prog ? prog.current / prog.total : null;
              return (
                <>
                  <View style={styles.modalHandle} />
                  <View style={[styles.modalIconWrap, unlocked && styles.modalIconWrapUnlocked]}>
                    <selectedAchievement.icon
                      size={36}
                      color={unlocked ? twColors.primary : twColors.muted}
                    />
                  </View>
                  <View style={styles.modalStatusRow}>
                    <View style={[styles.modalBadge, unlocked ? styles.modalBadgeUnlocked : styles.modalBadgeLocked]}>
                      <Text style={[styles.modalBadgeText, unlocked ? styles.modalBadgeTextUnlocked : styles.modalBadgeTextLocked]}>
                        {unlocked ? '✓ Desbloqueado' : 'Bloqueado'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalTitle}>{selectedAchievement.name}</Text>
                  <Text style={styles.modalDesc}>{selectedAchievement.description}</Text>
                  {prog && pct !== null && !unlocked && (
                    <View style={styles.modalProgressWrap}>
                      <View style={styles.modalProgressBar}>
                        <View style={[styles.modalProgressFill, { width: `${Math.round(pct * 100)}%` as any }]} />
                      </View>
                      <Text style={styles.modalProgressText}>
                        {prog.current} / {prog.total} {prog.unit}
                      </Text>
                    </View>
                  )}
                  {prog && unlocked && (
                    <View style={styles.modalProgressWrap}>
                      <View style={styles.modalProgressBar}>
                        <View style={[styles.modalProgressFill, { width: '100%' }]} />
                      </View>
                      <Text style={styles.modalProgressText}>
                        {prog.total} / {prog.total} {prog.unit} — completado
                      </Text>
                    </View>
                  )}
                  <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedAchievement(null)}>
                    <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                  </Pressable>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 24 },
  content: {
    width: '100%',
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 96,
    gap: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 20, fontFamily: twFonts.bold, color: twColors.foreground },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 18,
    gap: 16,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: twColors.primary + '30',
    borderWidth: 2,
    borderColor: twColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 17, fontFamily: twFonts.bold, color: twColors.foreground },
  profileSub: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted, marginTop: 2 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: twColors.primary + '20',
    borderWidth: borderWidth.default,
    borderColor: twColors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: borderWidth.default, borderTopColor: 'transparent' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: twFonts.bold, color: twColors.foreground },
  statLabel: { fontSize: 10, fontFamily: twFonts.regular, color: twColors.muted, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.foreground, marginBottom: 10 },
  achievementCount: {
    fontSize: 12,
    fontFamily: twFonts.medium,
    color: twColors.muted,
    marginBottom: 10,
  },
  achievementsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 4,
    paddingBottom: 4,
  },
  achievementCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    width: 100,
    gap: 4,
  },
  achievementCardLocked: {
    opacity: 0.45,
  },
  achievementLabel: {
    fontSize: 11,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    textAlign: 'center',
  },
  achievementLabelLocked: {
    color: twColors.muted,
  },
  achievementDesc: {
    fontSize: 9,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    textAlign: 'center',
    lineHeight: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: twColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: twColors.border,
    marginBottom: 8,
  },
  modalIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconWrapUnlocked: {
    backgroundColor: twColors.primary + '20',
    borderColor: twColors.primary + '60',
  },
  modalStatusRow: { flexDirection: 'row' },
  modalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: borderWidth.default,
  },
  modalBadgeUnlocked: {
    backgroundColor: twColors.primary + '20',
    borderColor: twColors.primary + '60',
  },
  modalBadgeLocked: {
    backgroundColor: twColors.card2,
    borderColor: twColors.border,
  },
  modalBadgeText: { fontSize: 12, fontFamily: twFonts.bold },
  modalBadgeTextUnlocked: { color: twColors.primary },
  modalBadgeTextLocked: { color: twColors.muted },
  modalTitle: {
    fontSize: 22,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalProgressWrap: { width: '100%', gap: 6, marginTop: 4 },
  modalProgressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: twColors.primary,
  },
  modalProgressText: {
    fontSize: 12,
    fontFamily: twFonts.medium,
    color: twColors.muted,
    textAlign: 'right',
  },
  modalCloseBtn: {
    marginTop: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  menuList: { gap: 8 },
  quickActionCard: {
    backgroundColor: twColors.background,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
  },
  quickActionCardHovered: { borderColor: twColors.primary },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: twFonts.medium, color: twColors.foreground },
  menuCount: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.muted },
});

export default Profile;
