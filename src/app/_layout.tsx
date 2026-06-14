import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import "../global.css";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { WorkoutProvider } from "@/context/WorkoutContext";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;
    const onLoginScreen = pathname === "/login";
    if (!user && !onLoginScreen) {
      router.replace("/login" as never);
    } else if (user && onLoginScreen) {
      router.replace("/" as never);
    }
  }, [user, pathname, fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="login" options={{ animation: "none" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
        <Stack.Screen name="routine/create" />
        <Stack.Screen name="routine/[id]" />
        <Stack.Screen
          name="workout/active"
          options={{ gestureEnabled: false, animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="history" />
        <Stack.Screen name="history/[sessionId]" />
        <Stack.Screen name="tools/calculator" />
        <Stack.Screen name="tools/bodyweight" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <InitialLayout />
      </WorkoutProvider>
    </AuthProvider>
  );
}
