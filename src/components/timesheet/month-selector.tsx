import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";
import { formatMonthYear } from "../../utils";

export interface MonthSelectorProps {
  selectedMonth: string;
  isCurrentMonth: boolean;
  canGoNext?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCurrentMonth: () => void;
}

export function MonthSelector({
  selectedMonth,
  isCurrentMonth,
  canGoNext = !isCurrentMonth,
  onPrevious,
  onNext,
  onCurrentMonth,
}: MonthSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <Pressable
          onPress={onPrevious}
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Tháng trước"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
        </View>

        <Pressable
          onPress={onNext}
          disabled={!canGoNext}
          style={({ pressed }) => [
            styles.navButton,
            !canGoNext && { opacity: 0.3 },
            pressed && canGoNext && styles.buttonPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Tháng sau"
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={canGoNext ? colors.textPrimary : colors.textDisabled}
          />
        </Pressable>
      </View>

      {!isCurrentMonth && (
        <Pressable
          onPress={onCurrentMonth}
          style={({ pressed }) => [
            styles.todayChip,
            pressed && styles.todayChipPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Về tháng hiện tại"
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.primary}
            style={styles.todayIcon}
          />
          <Text style={styles.todayText}>Về tháng hiện tại</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  navButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.7,
    backgroundColor: colors.border,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  monthText: {
    fontSize: typography.lg.fontSize,
    lineHeight: typography.lg.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  todayChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.full,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
    minHeight: 28,
  },
  todayChipPressed: {
    opacity: 0.8,
  },
  todayIcon: {
    marginRight: 4,
  },
  todayText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
});
