import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  colors,
  radius,
  spacing,
  typography,
  touchTargets,
} from "../../constants";

export interface VerificationBannerProps {
  hasLocationPermission: boolean | null;
  isGpsEnabled?: boolean;
  isLocationReady?: boolean;
  isWifiConnected: boolean;
  onRequestPermission: () => void;
  onOpenLocationSettings?: () => void;
}

export function VerificationBanner({
  hasLocationPermission,
  isGpsEnabled = true,
  isLocationReady = true,
  isWifiConnected,
  onRequestPermission,
  onOpenLocationSettings,
}: VerificationBannerProps) {
  const isGpsOk =
    isLocationReady && hasLocationPermission !== false && isGpsEnabled;

  const handleGpsAction = onOpenLocationSettings || onRequestPermission;

  return (
    <View style={styles.container}>
      {hasLocationPermission === false && (
        <View style={styles.permissionAlert}>
          <View style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <MaterialCommunityIcons
                name="map-marker-alert-outline"
                size={18}
                color={colors.warning}
                style={styles.alertIcon}
              />
              <Text style={styles.alertTitle}>Chưa cấp quyền vị trí</Text>
            </View>
            <Text style={styles.alertDescription}>
              Ứng dụng cần quyền vị trí để xác thực bạn đang ở trong khuôn viên
              công ty.
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={onRequestPermission}
            accessibilityRole="button"
          >
            <Text style={styles.permissionButtonText}>Cấp quyền</Text>
          </Pressable>
        </View>
      )}

      {hasLocationPermission === true && !isGpsEnabled && (
        <View style={styles.permissionAlert}>
          <View style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <MaterialCommunityIcons
                name="crosshairs-off"
                size={18}
                color={colors.warning}
                style={styles.alertIcon}
              />
              <Text style={styles.alertTitle}>Định vị GPS đang tắt</Text>
            </View>
            <Text style={styles.alertDescription}>
              Vui lòng bật dịch vụ định vị (Location) trên máy để thực hiện chấm
              công.
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleGpsAction}
            accessibilityRole="button"
          >
            <Text style={styles.permissionButtonText}>Bật GPS</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.indicatorsRow}>
        <View style={styles.badge}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: isWifiConnected
                  ? colors.success
                  : colors.warning,
              },
            ]}
          />
          <MaterialCommunityIcons
            name={isWifiConnected ? "wifi" : "wifi-off"}
            size={14}
            color={isWifiConnected ? colors.textPrimary : colors.warning}
            style={styles.badgeIcon}
          />
          <Text style={styles.badgeText}>
            {isWifiConnected ? "Đang bật Wi-Fi" : "Chưa kết nối Wi-Fi"}
          </Text>
        </View>

        <Pressable
          style={styles.badge}
          onPress={!isGpsOk ? handleGpsAction : undefined}
          disabled={isGpsOk}
        >
          <View
            style={[
              styles.dot,
              {
                backgroundColor: isGpsOk ? colors.success : colors.warning,
              },
            ]}
          />
          <MaterialCommunityIcons
            name={isGpsOk ? "crosshairs-gps" : "crosshairs"}
            size={14}
            color={isGpsOk ? colors.textPrimary : colors.warning}
            style={styles.badgeIcon}
          />
          <Text style={styles.badgeText}>
            {isGpsOk
              ? "Đã bật định vị GPS"
              : hasLocationPermission === false
                ? "Chưa cấp quyền GPS"
                : "Chưa bật định vị"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  permissionAlert: {
    backgroundColor: colors.warningSubtle,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  alertIcon: {
    marginRight: spacing.xxs,
  },
  alertTitle: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.semibold,
    color: colors.warning,
  },
  alertDescription: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.textSecondary,
  },
  permissionButton: {
    backgroundColor: colors.warning,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: touchTargets.min,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
  },
  indicatorsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: spacing.xxs,
  },
  badgeIcon: {
    marginRight: spacing.xxs,
  },
  badgeText: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
});
