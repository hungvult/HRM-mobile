import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../card";
import { colors, radius, spacing, typography } from "../../constants";
import { LeaveBalanceItem } from "../../types";

export interface LeaveBalanceCardProps {
  year: number;
  balances: LeaveBalanceItem[];
  loading?: boolean;
  error?: string | null;
  onPreviousYear: () => void;
  onNextYear: () => void;
  onRetry: () => void;
}

export function LeaveBalanceCard({
  year,
  balances,
  loading = false,
  error = null,
  onPreviousYear,
  onNextYear,
  onRetry,
}: LeaveBalanceCardProps) {
  const totals = useMemo(() => {
    let allocated = 0;
    let used = 0;
    let remaining = 0;

    for (const b of balances) {
      allocated += b.allocatedDays || 0;
      used += b.usedDays || 0;
      remaining += b.remainingDays || 0;
    }

    const percentUsed =
      allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;

    return { allocated, used, remaining, percentUsed };
  }, [balances]);

  return (
    <Card style={styles.card}>
      {/* Header: Title + Year Selector */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Quỹ phép năm</Text>
        </View>

        <View style={styles.yearNavigator}>
          <Pressable
            style={({ pressed }) => [
              styles.yearArrow,
              pressed && { opacity: 0.6 },
            ]}
            onPress={onPreviousYear}
            accessibilityRole="button"
            accessibilityLabel="Năm trước"
            hitSlop={8}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={colors.textPrimary}
            />
          </Pressable>

          <Text style={styles.yearText}>Năm {year}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.yearArrow,
              pressed && { opacity: 0.6 },
            ]}
            onPress={onNextYear}
            accessibilityRole="button"
            accessibilityLabel="Năm sau"
            hitSlop={8}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>
      </View>

      {/* Partial Error State with Retry Button */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={onRetry}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : loading && balances.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải quỹ phép...</Text>
        </View>
      ) : balances.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Chưa có thông tin quỹ phép năm {year}
          </Text>
        </View>
      ) : (
        <>
          {/* 3 Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Được cấp</Text>
              <Text style={styles.metricValue}>
                {totals.allocated} <Text style={styles.metricUnit}>ngày</Text>
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Đã dùng</Text>
              <Text style={[styles.metricValue, { color: colors.warning }]}>
                {totals.used} <Text style={styles.metricUnit}>ngày</Text>
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Còn lại</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {totals.remaining} <Text style={styles.metricUnit}>ngày</Text>
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Tỷ lệ đã sử dụng</Text>
              <Text style={styles.progressPercent}>{totals.percentUsed}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${totals.percentUsed}%`,
                    backgroundColor:
                      totals.percentUsed >= 90
                        ? colors.danger
                        : totals.percentUsed >= 70
                          ? colors.warning
                          : colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  yearNavigator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgApp,
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearArrow: {
    minWidth: 26,
    minHeight: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  yearText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginHorizontal: spacing.xxs,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: typography.xl.fontSize,
    lineHeight: typography.xl.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  metricUnit: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  progressSection: {
    marginTop: spacing.xs,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxs,
  },
  progressLabel: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dangerSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.xs.fontSize,
    color: colors.danger,
    marginRight: spacing.xs,
  },
  retryButton: {
    backgroundColor: colors.danger,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
  },
  loadingContainer: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.xs,
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  emptyText: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
  },
});
