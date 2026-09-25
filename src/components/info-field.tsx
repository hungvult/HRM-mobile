import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { colors, spacing, typography } from "../constants";

export interface InfoFieldProps {
  label: string;
  value?: string | null;
  isLast?: boolean;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function InfoField({
  label,
  value,
  isLast = false,
  rightAction,
  style,
}: InfoFieldProps) {
  return (
    <View style={[isLast ? styles.containerLast : styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value || "—"}</Text>
        {rightAction ? (
          <View style={styles.actionContainer}>{rightAction}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md, // 16px
  },
  containerLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    flex: 1,
  },
  actionContainer: {
    marginLeft: spacing.sm,
  },
});
