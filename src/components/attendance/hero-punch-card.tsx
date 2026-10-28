import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "../button";
import { Card } from "../card";
import { LiveClock } from "./live-clock";
import { WorkDurationCounter } from "./work-duration-counter";
import {
  colors,
  radius,
  spacing,
  typography,
  touchTargets,
} from "../../constants";
import { TodayAttendance } from "../../types";
import {
  formatTime,
  formatWorkingDuration,
  getAttendanceStatusConfig,
} from "../../utils";

export interface HeroPunchCardProps {
  todayData: TodayAttendance | null;
  loading: boolean;
  actionLoading: boolean;
  isLocationReady?: boolean;
  hasShift?: boolean;
  onRequestPermission: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function HeroPunchCard({
  todayData,
  loading,
  actionLoading,
  isLocationReady = true,
  hasShift = true,
  onRequestPermission,
  onCheckIn,
  onCheckOut,
}: HeroPunchCardProps) {
  const isHoliday = todayData?.attendanceStatus === "HOLIDAY";
  const isNoShift = !hasShift || isHoliday;

  const isCheckedIn = todayData?.checkedIn ?? false;
  const isCheckedOut = todayData?.checkedOut ?? false;

  const statusConfig = getAttendanceStatusConfig(todayData?.attendanceStatus);

  return (
    <Card style={styles.card}>
      {/* Shift Time Info & Status Tag */}
      <View style={styles.header}>
        <View style={styles.shiftBadge}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={14}
            color={colors.textSecondary}
            style={styles.shiftIcon}
          />
          <Text style={styles.shiftText}>
            {isNoShift
              ? "Hôm nay: Ngày nghỉ / Không có ca"
              : isCheckedIn && !isCheckedOut
                ? `Vào ca: ${formatTime(todayData?.checkInAt)}`
                : "Giờ làm việc linh hoạt"}
          </Text>
        </View>

        {isCheckedIn && (
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
          >
            <Text
              style={[styles.statusBadgeText, { color: statusConfig.text }]}
            >
              {statusConfig.label}
            </Text>
          </View>
        )}
      </View>

      {/* Real-time Digital Monospace Clock */}
      <LiveClock />

      {/* Middle status section */}
      {isNoShift ? (
        <View style={styles.noShiftInfoBox}>
          <MaterialCommunityIcons
            name="coffee-outline"
            size={24}
            color={colors.textSecondary}
            style={styles.noShiftIcon}
          />
          <Text style={styles.noShiftTitle}>Hôm nay không có ca làm việc</Text>
          <Text style={styles.noShiftSub}>
            Tận hưởng ngày nghỉ hoặc liên hệ quản lý nếu có thay đổi lịch làm.
          </Text>
        </View>
      ) : isCheckedIn && !isCheckedOut ? (
        <View style={styles.workingInfoBox}>
          <View style={styles.infoRow}>
            <View style={styles.labelWithIcon}>
              <MaterialCommunityIcons
                name="clock-check-outline"
                size={16}
                color={colors.warning}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.infoLabel}>Mốc Check-in:</Text>
            </View>
            <Text style={styles.infoValue}>
              {formatTime(todayData?.checkInAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.labelWithIcon}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={16}
                color={colors.warning}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.infoLabel}>Thời gian đã làm:</Text>
            </View>
            <WorkDurationCounter checkInAt={todayData?.checkInAt} />
          </View>
        </View>
      ) : isCheckedIn && isCheckedOut ? (
        <View style={styles.finishedInfoBox}>
          <View style={styles.finishedRow}>
            <View style={styles.finishedCol}>
              <Text style={styles.finishedLabel}>Giờ vào</Text>
              <Text style={styles.finishedValue}>
                {formatTime(todayData?.checkInAt)}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.finishedCol}>
              <Text style={styles.finishedLabel}>Giờ ra</Text>
              <Text style={styles.finishedValue}>
                {formatTime(todayData?.checkOutAt)}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.finishedCol}>
              <Text style={styles.finishedLabel}>Tổng giờ làm</Text>
              <Text style={styles.finishedValue}>
                {formatWorkingDuration(todayData?.workingMinutes)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.readyInfoBox}>
          <MaterialCommunityIcons
            name="map-marker-radius-outline"
            size={18}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.readyInfoText}>
            Sẵn sàng chấm công trong phạm vi văn phòng
          </Text>
        </View>
      )}

      {/* CTA Button in Thumb Zone */}
      <View style={styles.ctaContainer}>
        {isNoShift ? (
          <Button
            title="Không có ca làm việc"
            variant="primary"
            disabled={true}
            onPress={() => {}}
            style={styles.completedButton}
            textStyle={styles.completedButtonText}
          />
        ) : !isCheckedIn ? (
          !isLocationReady ? (
            /* Smart Disable CTA */
            <Pressable
              style={({ pressed }) => [
                styles.smartDisableButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onRequestPermission}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={20}
                color={colors.warning}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.smartDisableText}>
                Bật định vị để Check-in
              </Text>
            </Pressable>
          ) : (
            <Button
              title="Check-in Bắt đầu ca"
              variant="success"
              loading={actionLoading}
              disabled={loading}
              onPress={onCheckIn}
              style={styles.heroButton}
              textStyle={styles.heroButtonText}
            />
          )
        ) : isCheckedIn && !isCheckedOut ? (
          !isLocationReady ? (
            /* Smart Disable CTA when checking out */
            <Pressable
              style={({ pressed }) => [
                styles.smartDisableButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onRequestPermission}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={20}
                color={colors.warning}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.smartDisableText}>
                Bật định vị để Check-out
              </Text>
            </Pressable>
          ) : (
            <Button
              title="Check-out Kết thúc ca"
              variant="warning"
              loading={actionLoading}
              disabled={loading}
              onPress={onCheckOut}
              style={styles.heroButton}
              textStyle={styles.heroButtonText}
            />
          )
        ) : (
          <View style={styles.completedContainer}>
            <Button
              title="Đã hoàn thành ca hôm nay"
              variant="primary"
              disabled={true}
              onPress={() => {}}
              style={styles.completedButton}
              textStyle={styles.completedButtonText}
            />
            <Text style={styles.wishText}>
              Đã hoàn tất ca hôm nay - Hẹn gặp lại ngày mai! 👋
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgApp,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shiftIcon: {
    marginRight: 4,
  },
  shiftText: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  statusBadge: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
  },
  readyInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  readyInfoText: {
    fontSize: typography.xs.fontSize,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  workingInfoBox: {
    backgroundColor: colors.warningSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  finishedInfoBox: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  finishedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  finishedCol: {
    alignItems: "center",
  },
  finishedLabel: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  finishedValue: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  dividerVertical: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  noShiftInfoBox: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noShiftIcon: {
    marginBottom: spacing.xs,
  },
  noShiftTitle: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  noShiftSub: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
  },
  ctaContainer: {
    marginTop: spacing.xs,
  },
  heroButton: {
    minHeight: 54,
    borderRadius: radius.lg,
  },
  heroButtonText: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.semibold,
  },
  smartDisableButton: {
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.bgApp,
    borderWidth: 1.5,
    borderColor: colors.warning,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  smartDisableText: {
    color: colors.warning,
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.semibold,
  },
  completedContainer: {
    alignItems: "center",
    width: "100%",
  },
  completedButton: {
    minHeight: 54,
    width: "100%",
    borderRadius: radius.lg,
    backgroundColor: colors.border,
  },
  completedButtonText: {
    color: colors.textDisabled,
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.semibold,
  },
  wishText: {
    marginTop: spacing.sm,
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
