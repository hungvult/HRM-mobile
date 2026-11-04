import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";

export interface PayrollEmptyStateProps {
  selectedYear?: number | null;
  onRefresh?: () => void;
}

export function PayrollEmptyState({
  selectedYear,
  onRefresh,
}: PayrollEmptyStateProps) {
  const isFiltered = selectedYear !== undefined && selectedYear !== null;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons
          name="receipt-outline"
          size={48}
          color={colors.textSecondary}
        />
      </View>

      <Text style={styles.title}>
        {isFiltered
          ? `Chưa có phiếu lương trong năm ${selectedYear}`
          : "Chưa có phiếu lương đã công bố."}
      </Text>

      <Text style={styles.description}>
        {isFiltered
          ? "Bạn có thể chọn năm khác hoặc kéo xuống để làm mới dữ liệu."
          : "Các kỳ lương sau khi được bộ phận nhân sự công bố sẽ xuất hiện tại đây."}
      </Text>

      {onRefresh && (
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Làm mới danh sách phiếu lương"
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
          <Text style={styles.refreshButtonText}>Làm mới</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["3xl"],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minHeight: touchTargets.min,
    gap: spacing.xs,
  },
  refreshButtonText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});
