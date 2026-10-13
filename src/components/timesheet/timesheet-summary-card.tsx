import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../card";
import { colors, radius, spacing, typography } from "../../constants";
import { MonthlyAttendanceSummary } from "../../types";

export interface TimesheetSummaryCardProps {
  summary: MonthlyAttendanceSummary;
}

export function TimesheetSummaryCard({ summary }: TimesheetSummaryCardProps) {
  const accumulatedHours =
    Math.round((summary.totalWorkingMinutes / 60) * 10) / 10;

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Tổng quan tháng</Text>

      {/* Main KPI Stats */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValue}>{summary.totalWorkDays}</Text>
          <Text style={styles.kpiLabel}>Ngày công chuẩn</Text>
        </View>

        <View style={styles.dividerVertical} />

        <View style={styles.kpiBox}>
          <Text style={styles.kpiValue}>{accumulatedHours}h</Text>
          <Text style={styles.kpiLabel}>Giờ làm tích lũy</Text>
        </View>
      </View>

      {/* Secondary Metrics */}
      <View style={styles.subMetricsContainer}>
        <View style={styles.subMetricItem}>
          <View
            style={[styles.subMetricDot, { backgroundColor: colors.success }]}
          />
          <Text style={styles.subMetricLabel}>Đã chấm công:</Text>
          <Text style={styles.subMetricValue}>{summary.totalWorkDays}</Text>
        </View>

        <View style={styles.subMetricItem}>
          <View
            style={[styles.subMetricDot, { backgroundColor: colors.warning }]}
          />
          <Text style={styles.subMetricLabel}>Chưa chốt ca:</Text>
          <Text style={styles.subMetricValue}>{summary.incompleteDays}</Text>
        </View>

        <View style={styles.subMetricItem}>
          <View
            style={[styles.subMetricDot, { backgroundColor: colors.primary }]}
          />
          <Text style={styles.subMetricLabel}>Nghỉ phép:</Text>
          <Text style={styles.subMetricValue}>{summary.leaveDays}</Text>
        </View>

        <View style={styles.subMetricItem}>
          <View
            style={[styles.subMetricDot, { backgroundColor: colors.danger }]}
          />
          <Text style={styles.subMetricLabel}>Vắng mặt:</Text>
          <Text style={styles.subMetricValue}>{summary.absentDays}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiBox: {
    flex: 1,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: typography["2xl"].fontSize,
    lineHeight: typography["2xl"].lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  kpiLabel: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  dividerVertical: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  subMetricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.md,
    gap: spacing.xs,
    justifyContent: "space-between",
  },
  subMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: "45%",
    paddingVertical: spacing.xxs,
  },
  subMetricDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  subMetricLabel: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    marginRight: spacing.xxs,
  },
  subMetricValue: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
});
