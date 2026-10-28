import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";
import { LeaveFilterStatus } from "../../types";

export interface LeaveStatusFilterProps {
  selectedStatus: LeaveFilterStatus;
  onSelectStatus: (status: LeaveFilterStatus) => void;
  countMap?: Partial<Record<LeaveFilterStatus, number>>;
}

const FILTER_OPTIONS: Array<{ key: LeaveFilterStatus; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "REJECTED", label: "Từ chối" },
  { key: "CANCELLED", label: "Đã hủy" },
];

export function LeaveStatusFilter({
  selectedStatus,
  onSelectStatus,
  countMap,
}: LeaveStatusFilterProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_OPTIONS.map((option) => {
          const isSelected = selectedStatus === option.key;
          const count = countMap?.[option.key];

          return (
            <Pressable
              key={option.key}
              onPress={() => onSelectStatus(option.key)}
              style={({ pressed }) => [
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillUnselected,
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected
                    ? styles.pillTextSelected
                    : styles.pillTextUnselected,
                ]}
              >
                {option.label}
                {typeof count === "number" && count > 0 ? ` (${count})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: 2,
    gap: spacing.xs,
  },
  pill: {
    minHeight: touchTargets.min,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pillUnselected: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.medium,
  },
  pillTextSelected: {
    color: "#FFFFFF",
    fontWeight: typography.weights.semibold,
  },
  pillTextUnselected: {
    color: colors.textSecondary,
  },
});
