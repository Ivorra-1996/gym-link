import { Slot } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import BottomNav from "./BottomNav";

export default function AppTabs() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
