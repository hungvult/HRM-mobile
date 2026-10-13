import React from "react";
import { Modal, StyleSheet, Text, View, Pressable } from "react-native";
import {
  colors,
  radius,
  spacing,
  typography,
  touchTargets,
} from "../../constants";
import { AttendanceActionResponse } from "../../types";
import { formatTime, formatWorkingDuration } from "../../utils";

export interface PunchSummaryModalProps {
  visible: boolean;
  data: AttendanceActionResponse | null;
  onClose: () => void;
}

export function PunchSummaryModal({
  visible,
  data,
  onClose,
}: PunchSummaryModalProps) {
  if (!data) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
            <Text style={styles.title}>Tổng kết Ca làm việc</Text>
            <Text style={styles.message}>
              {data.message || "Ghi nhận Check-out thành công!"}
            </Text>
          </View>

          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giờ Check-in:</Text>
              <Text style={styles.summaryValue}>
                {formatTime(data.checkInAt)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giờ Check-out:</Text>
              <Text style={styles.summaryValue}>
                {formatTime(data.checkOutAt)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Trạng thái ngày công:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  Hoàn tất ngày công (PRESENT)
                </Text>
              </View>
            </View>

            <View style={[styles.summaryRow, styles.highlightRow]}>
              <Text style={styles.highlightLabel}>Tổng thời gian làm:</Text>
              <Text style={styles.highlightValue}>
                {formatWorkingDuration(data.workingMinutes)}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>Đã hiểu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  checkIcon: {
    fontSize: 28,
    color: colors.success,
    fontWeight: typography.weights.bold,
  },
  title: {
    fontSize: typography.xl.fontSize,
    lineHeight: typography.xl.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
    textAlign: "center",
  },
  message: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.textSecondary,
    textAlign: "center",
  },
  summaryList: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.sm.fontSize,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  statusBadge: {
    backgroundColor: colors.successSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.success,
  },
  highlightRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  highlightLabel: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  highlightValue: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  closeButton: {
    backgroundColor: colors.primary,
    minHeight: touchTargets.min,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.semibold,
  },
});
