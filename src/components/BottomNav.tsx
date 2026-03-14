import { Href, usePathname, useRouter } from "expo-router";
import { Dumbbell, Home, Search, User } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
    borderWidth,
    twColors,
    twFonts,
    twRadius,
} from "../constants/tailwind-runtime-theme";

const tabs = [
  { icon: Home, label: "Inicio", path: "/" as Href },
  { icon: Dumbbell, label: "Entrenar", path: "/train" as Href },
  { icon: Search, label: "Descubrir", path: "/discover" as Href },
  { icon: User, label: "Perfil", path: "/profile" as Href },
];

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Pressable
              key={tab.label}
              onPress={() => router.push(tab.path)}
              style={styles.tabButton}
            >
              {isActive && <View style={styles.activeTabIndicator} />}
              <tab.icon
                size={22}
                color={isActive ? twColors.primary : twColors.mutedForeground}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    borderTopWidth: borderWidth.default,
    borderTopColor: twColors.border,
    backgroundColor: twColors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 512,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  activeTabIndicator: {
    position: "absolute",
    top: -8,
    width: 28,
    height: 3,
    borderRadius: twRadius.lg,
    backgroundColor: twColors.primary,
  },
  label: {
    marginTop: 2,
    fontSize: 10,
    color: twColors.mutedForeground,
    fontFamily: twFonts.medium,
  },
  labelActive: {
    color: twColors.primary,
  },
});

export default BottomNav;
