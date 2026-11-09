import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../constants";
import { formatCurrency } from "../../utils/formatters";

export interface PayrollSummaryCardProps {
  standardWorkingDays?: number;
  paidWorkingDays?: number;
  earnedBaseSalary?: number;
  earnedAllowance?: number;
  earnedDeduction?: number;
  netSalary?: number;
}

export function PayrollSummaryCard({
  standardWorkingDays,
  paidWorkingDays,
  earnedBaseSalary,
  earnedAllowance,
  earnedDeduction,
  netSalary,
}: PayrollSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tóm tắt chỉ số</Text>

      {/* Grid of 2 columns */}
      <View style={styles.grid}>
        {standardWorkingDays !== undefined && (
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>Công chuẩn</Text>
            <Text style={styles.itemValue}>{standardWorkingDays} ngày</Text>
          </View>
        )}

        {paidWorkingDays !== undefined && (
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>Công hưởng lương</Text>
            <Text style={styles.itemValue}>{paidWorkingDays} ngày</Text>
          </View>
        )}

        {earnedBaseSalary !== undefined && (
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>Lương theo công</Text>
            <Text style={styles.itemValue}>
              {formatCurrency(earnedBaseSalary)}
            </Text>
          </View>
        )}

        {earnedAllowance !== undefined && (
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>Phụ cấp thực tế</Text>
            <Text style={styles.itemValue}>
              {formatCurrency(earnedAllowance)}
            </Text>
          </View>
        )}

        {earnedDeduction !== undefined && (
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>Khấu trừ thực tế</Text>
            <Text style={[styles.itemValue, styles.deductionText]}>
              -{formatCurrency(earnedDeduction)}
            </Text>
          </View>
        )}

        {netSalary !== undefined && (
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>Thực lĩnh</Text>
            <Text style={[styles.itemValue, styles.netText]}>
              {formatCurrency(netSalary)}
            </Text>
          </View>
        )}
      </View>
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
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.md,
  },
  gridItem: {
    width: "50%",
    paddingRight: spacing.sm,
  },
  itemLabel: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  itemValue: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  deductionText: {
    color: colors.danger,
  },
  netText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});
