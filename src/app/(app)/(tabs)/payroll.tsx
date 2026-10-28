import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../../constants";

export default function PayrollRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lương & Thu nhập</Text>
      <Text style={styles.subtitle}>
        Chức năng đang được hoàn thiện (UC019)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.xl.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
