import React from "react";
import { useColorScheme } from "react-native";
import "../global.css";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
    // <Stack
    //   screenOptions={{
    //     headerStyle: { backgroundColor: "cornflowerblue" },
    //     headerTintColor: "#fff",
    //     animation: "slide_from_right",
    //   }}
    // >
    //   <Stack.Screen name="index" options={{ title: "Home" }} />
    //   <Stack.Screen name="profile" options={{ title: "About" }} />
    // </Stack>
  );
}
