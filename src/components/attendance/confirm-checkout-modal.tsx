import React, { useMemo } from "react";
import { Modal, StyleSheet, Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatWorkingDuration } from "../../utils/formatters";
import {
  colors,
  radius,
  spacing,
  typography,
  touchTargets,
} from "../../constants";

export interface ConfirmCheckoutModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  checkInAt?: string | null;
}

export function ConfirmCheckoutModal({
  visible,
  onCancel,
  onConfirm,
  loading = false,
  checkInAt,
}: ConfirmCheckoutModalProps) {
  const now = new Date();
  const currentTimeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const workingDuration = useMemo(() => {
    if (!checkInAt) return null;
    try {
      const checkInTime = new Date(checkInAt).getTime();
      if (isNaN(checkInTime)) return null;
      const totalMinutes = Math.max(
        0,
        Math.floor((Date.now() - checkInTime) / 60000),
      );
      return formatWorkingDuration(totalMinutes);
    } catch {
      return null;
    }
  }, [checkInAt]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Xác nhận Kết thúc ca làm</Text>

          <View style={styles.infoBox}>
            <Text style={styles.message}>
              Xác nhận kết thúc ca làm việc lúc{" "}
              <Text style={styles.boldTimeText}>{currentTimeFormatted}</Text>?
            </Text>

            {workingDuration && (
              <View style={styles.durationRow}>
                <MaterialCommunityIcons
                  name="clock-time-four-outline"
                  size={16}
                  color={colors.warning}
                  style={styles.durationIcon}
                />
                <Text style={styles.durationLabel}>
                  Thời gian làm việc trong ca:{" "}
                  <Text style={styles.durationValue}>{workingDuration}</Text>
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onCancel}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Tiếp tục làm việc</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && { opacity: 0.8 },
                loading && { opacity: 0.6 },
              ]}
              onPress={onConfirm}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>
                {loading ? "Đang xử lý..." : "Xác nhận Check-out"}
              </Text>
            </Pressable>
          </View>
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
  title: {
    fontSize: typography.lg.fontSize,
    lineHeight: typography.lg.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  message: {
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    color: colors.textPrimary,
    textAlign: "center",
  },
  boldTimeText: {
    fontWeight: typography.weights.bold,
    color: colors.warning,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: "100%",
  },
  durationIcon: {
    marginRight: 6,
  },
  durationLabel: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
  },
  durationValue: {
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    minHeight: touchTargets.min,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  confirmButton: {
    flex: 1,
    minHeight: touchTargets.min,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
  },
  confirmText: {
    fontSize: typography.sm.fontSize,
    color: "#FFFFFF",
    fontWeight: typography.weights.semibold,
  },
});
