import { Href, router } from "expo-router";
import {
  Calendar,
  ChevronRight,
  Flame,
  Settings,
  TrendingUp,
  Trophy,
  User,
  Zap,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  borderWidth,
  twColors,
  twFonts,
  twRadius,
} from "../constants/tailwind-runtime-theme";

const achievements = [
  { icon: Flame, label: "Racha 12 días" },
  { icon: Trophy, label: "100 entrenos" },
  { icon: Zap, label: "PR Sentadilla" },
  { icon: Calendar, label: "Meta mensual" },
];

const stats = [
  { value: "48", label: "Entrenos" },
  { value: "12", label: "Racha" },
  { value: "156", label: "Conexiones" },
];

const menuItems = [
  // { icon: Dumbbell, label: "Mis Rutinas", count: "5" },
  {
    icon: TrendingUp,
    label: "Estadísticas mensual",
    count: "",
    href: "/statistics",
  },
  { icon: Calendar, label: "Historial", count: "48", href: "/history" },
  // { icon: Award, label: "Logros", count: "12" },
  // { icon: UploadCloud, label: "Progreso", count: "" },
];

const Profile = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
            <Text style={styles.title}>Perfil</Text>
            <Pressable style={styles.settingsButton}>
              <Settings size={16} color={twColors.foreground} />
            </Pressable>
          </View>

          {/* Profile Card */}
          <Animated.View
            entering={FadeInUp.delay(50)}
            style={styles.profileCard}
          >
            <View style={styles.profileTop}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>
                  <User size={24} color={twColors.primary} />
                </Text>
              </View>
              <View>
                <Text style={styles.profileName}>Jose Ivorra</Text>
                <Text style={styles.profileSub}>
                  @jose_fit · Argentina, Morón
                </Text>
              </View>
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

          {/* Logros */}
          <Animated.View entering={FadeInUp.delay(120)}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.sectionTitle}>Logros recientes</Text>
              <Text style={styles.achievementLabel}>Ver más</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsRow}
            >
              {achievements.map((a) => (
                <View key={a.label} style={styles.achievementCard}>
                  <a.icon size={24} color={twColors.primary} />
                  <Text style={styles.achievementLabel}>{a.label}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Menú */}
          <Animated.View
            entering={FadeInDown.delay(180)}
            style={styles.menuList}
          >
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
                  if (m.href) {
                    router.push(m.href as Href);
                  }
                }}
              >
                <View style={styles.menuIconWrap}>
                  <m.icon size={16} color={twColors.primary} />
                </View>
                <Text style={styles.menuLabel}>{m.label}</Text>
                {m.count ? (
                  <Text style={styles.menuCount}>{m.count}</Text>
                ) : null}
                <ChevronRight size={14} color={twColors.muted} />
              </Pressable>
            ))}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: twColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 24,
  },
  content: {
    width: "100%",
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 96,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 18,
    gap: 16,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: twColors.primary + "30",
    borderWidth: 2,
    borderColor: twColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 26,
  },
  profileName: {
    fontSize: 17,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  profileSub: {
    fontSize: 11,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: borderWidth.default,
    borderTopColor: "transparent",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    marginBottom: 10,
  },
  achievementsRow: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    gap: 12,
    paddingRight: 4,
  },
  achievementCard: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    minWidth: 88,
  },
  achievementLabel: {
    fontSize: 10,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    marginTop: 4,
    textAlign: "center",
    cursor: "pointer",
  },
  menuList: {
    gap: 8,
  },
  quickActionCard: {
    backgroundColor: twColors.background,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 4,
  },
  quickActionCardHovered: {
    borderColor: twColors.primary,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: twFonts.medium,
    color: twColors.foreground,
  },
  menuCount: {
    fontSize: 12,
    fontFamily: twFonts.regular,
    color: twColors.muted,
  },
});

export default Profile;
