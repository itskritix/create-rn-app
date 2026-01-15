import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetwork } from "../hooks/useNetwork";

export function OfflineBanner() {
  const { isOffline } = useNetwork();
  const insets = useSafeAreaInsets();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.banner}>
        <Text style={styles.text}>No internet connection</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    backgroundColor: "#FF3B30",
  },
  banner: {
    paddingVertical: 8,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
