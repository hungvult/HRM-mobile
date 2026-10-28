import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../../constants";
import { LeaveRequestListItem } from "../../types";
import {
  formatDateRange,
  formatDateTime,
  getLeaveStatusConfig,
} from "../../utils";

export interface LeaveRequestCardProps {
  item: LeaveRequestListItem;
  onPress: (item: LeaveRequestListItem) => void;
}

export function LeaveRequestCard({ item, onPress }: LeaveRequestCardProps) {
  const statusConfig = getLeaveStatusConfig(item.status);
  const dateRangeStr = formatDateRange(item.startDate, item.endDate);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Đơn ${item.requestCode}, ${statusConfig.label}`}
    >
      {/* Top row: Type Name + Status Badge */}
      <View style={styles.topRow}>
        <View style={styles.codeRow}>
          <Text style={styles.requestCode}>#{item.requestCode}</Text>
          <Text style={styles.typeName} numberOfLines={1}>
            {item.leaveTypeName || item.leaveTypeCode}
          </Text>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
        >
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Middle row: Date range + Requested days */}
      <View style={styles.detailsRow}>
        <View style={styles.dateBlock}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color={colors.primary}
            style={styles.iconMargin}
          />
          <Text style={styles.dateText}>{dateRangeStr}</Text>
        </View>

        <View style={styles.daysBadge}>
          <Text style={styles.daysText}>{item.requestedDays} ngày</Text>
        </View>
      </View>

      {/* Reason snippet if provided */}
      {Boolean(item.reason) && (
        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reason}
        </Text>
      )}

      {/* Bottom row: Created At + Chevron */}
      <View style={styles.bottomRow}>
        <Text style={styles.createdAtText}>
          Gửi: {formatDateTime(item.createdAt)}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textDisabled}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.xs,
  },
  requestCode: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  typeName: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: spacing.xs,
  },
  dateBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconMargin: {
    marginRight: 6,
  },
  dateText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  daysBadge: {
    backgroundColor: colors.primarySubtle,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  daysText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  reasonText: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
    fontStyle: "italic",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.bgApp,
    paddingTop: spacing.xs,
    marginTop: spacing.xxs,
  },
  createdAtText: {
    fontSize: typography.xs.fontSize,
    color: colors.textDisabled,
  },
});
