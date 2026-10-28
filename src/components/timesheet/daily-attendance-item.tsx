import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../constants";
import { MonthlyAttendanceItem } from "../../types";
import {
  formatFullWorkDate,
  formatTime,
  formatWorkingDuration,
  getAttendanceStatusConfig,
} from "../../utils";

export interface DailyAttendanceItemProps {
  item: MonthlyAttendanceItem;
  isSelected?: boolean;
}

export function DailyAttendanceItem({
  item,
  isSelected = false,
}: DailyAttendanceItemProps) {
  const statusConfig = getAttendanceStatusConfig(item.attendanceStatus);

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      {/* Header: Date + Status Badge */}
      <View style={styles.headerRow}>
        <Text style={styles.dateText}>{formatFullWorkDate(item.workDate)}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
        >
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Body: Check-in, Check-out, Working duration */}
      <View style={styles.detailsRow}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Giờ vào</Text>
          <Text style={styles.detailValue}>{formatTime(item.checkInAt)}</Text>
        </View>

        <View style={styles.dividerVertical} />

        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Giờ ra</Text>
          <Text style={styles.detailValue}>{formatTime(item.checkOutAt)}</Text>
        </View>

        <View style={styles.dividerVertical} />

        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Thời lượng</Text>
          <Text style={styles.detailValue}>
            {item.workingMinutes
              ? formatWorkingDuration(item.workingMinutes)
              : "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  containerSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.bgApp,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  detailCol: {
    alignItems: "center",
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  dividerVertical: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
});
