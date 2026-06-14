import { Tabs } from 'expo-router';
import { Dumbbell, Home, Search, User } from 'lucide-react-native';
import React from 'react';
import { twColors, twFonts } from '@/constants/tailwind-runtime-theme';

export default function TabsLayout() {
  return (
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
  );
}
