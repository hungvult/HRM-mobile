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
import { MyPayslipSummaryItem } from "../../types";
import {
  formatCurrency,
  formatDate,
  formatPeriodMonthYear,
} from "../../utils/formatters";

export interface NetSalaryCardProps {
  payslip: MyPayslipSummaryItem;
  isAmountHidden: boolean;
  onToggleHideAmount: () => void;
  onPressDetail: () => void;
}

export function NetSalaryCard({
  payslip,
  isAmountHidden,
  onToggleHideAmount,
  onPressDetail,
}: NetSalaryCardProps) {
  const periodLabel = formatPeriodMonthYear(payslip.month, payslip.year);
  const formattedDate = formatDate(payslip.publishedAt);
  const displayAmount = isAmountHidden
    ? "•••••••• ₫"
    : formatCurrency(payslip.netSalary);

  return (
    <View style={styles.card}>
      {/* Top row: Period title & Published badge */}
      <View style={styles.topRow}>
        <View style={styles.periodInfo}>
          <Text style={styles.periodLabel}>{periodLabel}</Text>
          {formattedDate ? (
            <Text style={styles.dateLabel}>Công bố: {formattedDate}</Text>
          ) : null}
        </View>

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Đã công bố</Text>
        </View>
      </View>

      {/* Center block: Net salary label & amount with eye icon */}
      <View style={styles.salarySection}>
        <Text style={styles.salaryTitle}>THỰC LĨNH</Text>
        <View style={styles.amountRow}>
          <Text
            style={styles.amountText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayAmount}
          </Text>

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={onToggleHideAmount}
            accessibilityRole="button"
            accessibilityLabel={
              isAmountHidden ? "Hiện số tiền thực lĩnh" : "Ẩn số tiền thực lĩnh"
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isAmountHidden ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom action: View detail */}
      <TouchableOpacity
        style={styles.detailButton}
        onPress={onPressDetail}
        accessibilityRole="button"
        accessibilityLabel={`Xem chi tiết phiếu lương ${periodLabel}`}
        activeOpacity={0.7}
      >
        <Text style={styles.detailButtonText}>Xem chi tiết phiếu lương</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  periodInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  periodLabel: {
    fontSize: typography.lg.fontSize,
    lineHeight: typography.lg.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  dateLabel: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  badgeText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.success,
  },
  salarySection: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  salaryTitle: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: spacing.xxs,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountText: {
    fontSize: typography["2xl"].fontSize,
    lineHeight: typography["2xl"].lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.primaryHover,
    flex: 1,
    marginRight: spacing.sm,
  },
  eyeButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: "center",
    justifyContent: "center",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: touchTargets.min,
  },
  detailButtonText: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginRight: spacing.xxs,
  },
});
