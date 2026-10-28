import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ConfirmCheckoutModal,
  HeroPunchCard,
  MainTopBar,
  PunchSummaryModal,
  VerificationBanner,
} from "../../components";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";
import { useAttendance, useUser } from "../../hooks";
import { AttendanceActionResponse } from "../../types";
import {
  formatTime,
  getAvatarLetter,
  getFriendlyErrorMessage,
} from "../../utils";

export function HomeScreen() {
  const router = useRouter();
  const { user, employee } = useUser();
  const {
    todayData,
    isLoading,
    isActionLoading,
    error,
    errorDetail,
    hasLocationPermission,
    isGpsEnabled,
    isLocationReady,
    isWifiConnected,
    hasShift,
    refresh,
    requestLocationPermission,
    enableLocationService,
    clearError,
    checkIn,
    checkOut,
  } = useAttendance();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [summaryData, setSummaryData] =
    useState<AttendanceActionResponse | null>(null);
  const [pendingSummary, setPendingSummary] =
    useState<AttendanceActionResponse | null>(null);

  const fullName = employee?.fullName || user?.username || "Bạn";
  const avatarLetter = getAvatarLetter(employee?.fullName, user?.username);

  const handlePressCheckIn = async () => {
    try {
      const res = await checkIn();
      Alert.alert(
        "Thành công",
        res.message || "Ghi nhận Check-in đầu ca thành công!",
      );
    } catch {
      // Lỗi đã được useAttendance phân loại và hiển thị chi tiết trên Error Banner
    }
  };

  const handlePressCheckOut = () => {
    setConfirmModalVisible(true);
  };

  const handleConfirmCheckOut = async () => {
    try {
      const res = await checkOut();
      setPendingSummary(res);
      setConfirmModalVisible(false);
    } catch {
      setConfirmModalVisible(false);
      // Lỗi đã được useAttendance phân loại và hiển thị chi tiết trên Error Banner
    }
  };

  // iOS modal transition race condition fix
  useEffect(() => {
    if (!confirmModalVisible && pendingSummary) {
      setSummaryData(pendingSummary);
      setPendingSummary(null);
    }
  }, [confirmModalVisible, pendingSummary]);

  const renderErrorBanner = () => {
    if (!error && !errorDetail) return null;

    let iconName: keyof typeof MaterialIcons.glyphMap = "error-outline";
    let title = "Đã xảy ra lỗi";
    let message = error || "";
    let actionLabel: string | null = null;
    let actionCallback: (() => void) | null = null;

    if (errorDetail) {
      switch (errorDetail.type) {
        case "WIFI_INVALID":
          iconName = "wifi-off";
          title = "Sai mạng Wi-Fi";
          message =
            errorDetail.message ||
            "Bạn chưa kết nối đúng Wi-Fi văn phòng công ty. Vui lòng kiểm tra lại mạng Wi-Fi.";
          actionLabel = "Thử lại";
          actionCallback = refresh;
          break;
        case "LOCATION_OUTSIDE":
          iconName = "location-off";
          title = "Ngoài phạm vi";
          message =
            errorDetail.message ||
            "Bạn đang ở ngoài khu vực làm việc cho phép của văn phòng.";
          actionLabel = "Thử lại";
          actionCallback = refresh;
          break;
        case "GPS_INVALID":
          iconName = "gps-not-fixed";
          title = "Chưa có GPS";
          message =
            errorDetail.message ||
            "Không thể lấy toạ độ GPS chính xác. Vui lòng bật định vị thiết bị.";
          actionLabel = "Bật định vị";
          actionCallback = enableLocationService;
          break;
        case "ALREADY_CHECKED":
          iconName = "sync";
          title = "Đồng bộ dữ liệu";
          message =
            errorDetail.message ||
            "Trạng thái ca làm việc đã thay đổi. Dữ liệu đã được cập nhật mới nhất.";
          break;
        case "FORBIDDEN":
          iconName = "block";
          title = "Không có quyền chấm công";
          message =
            errorDetail.message ||
            "Bạn không có quyền thực hiện chấm công hoặc tài khoản chưa liên kết hồ sơ nhân viên.";
          actionLabel = "Kiểm tra lại";
          actionCallback = refresh;
          break;
        case "SERVER_ERROR":
          iconName = "dns";
          title = "Lỗi hệ thống";
          message =
            errorDetail.message ||
            "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
          actionLabel = "Thử lại";
          actionCallback = refresh;
          break;
        case "NETWORK_ERROR":
          iconName = "cloud-off";
          title = "Lỗi kết nối";
          message =
            errorDetail.message ||
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.";
          actionLabel = "Thử lại";
          actionCallback = refresh;
          break;
        case "UNKNOWN":
        default:
          iconName = "error-outline";
          title = "Thông báo lỗi";
          message = errorDetail.message || error || "Đã có lỗi xảy ra.";
          actionLabel = "Thử lại";
          actionCallback = refresh;
          break;
      }
    }

    return (
      <View style={styles.errorBox}>
        <View style={styles.errorHeader}>
          <MaterialIcons name={iconName} size={20} color={colors.danger} />
          <Text style={styles.errorTitle}>{title}</Text>
          <Pressable
            hitSlop={8}
            onPress={clearError}
            style={styles.errorCloseBtn}
            accessibilityLabel="Đóng thông báo lỗi"
          >
            <MaterialIcons
              name="close"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
        <Text style={styles.errorText}>{message}</Text>
        {actionLabel && actionCallback && (
          <Pressable
            style={styles.errorActionBtn}
            onPress={actionCallback}
            accessibilityRole="button"
          >
            <Text style={styles.errorActionText}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <MainTopBar
        leftContent={
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingTitle} numberOfLines={2}>
                Xin chào! {fullName}
              </Text>
            </View>
          </View>
        }
        containerStyle={styles.topBarContainer}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Verification Status & Permission Banner */}
        <VerificationBanner
          hasLocationPermission={hasLocationPermission}
          isGpsEnabled={isGpsEnabled}
          isWifiConnected={isWifiConnected}
          onRequestPermission={requestLocationPermission}
          onOpenLocationSettings={enableLocationService}
        />

        {/* Dynamic Error & Resolution Banner */}
        {renderErrorBanner()}

        {/* Main Hero Punch Attendance Card */}
        <HeroPunchCard
          todayData={todayData}
          loading={isLoading}
          actionLoading={isActionLoading}
          isLocationReady={isLocationReady}
          hasShift={hasShift}
          onRequestPermission={enableLocationService}
          onCheckIn={handlePressCheckIn}
          onCheckOut={handlePressCheckOut}
        />

        {/* Widget: Tóm tắt thông tin ca làm việc hôm nay */}
        <View style={styles.summaryWidget}>
          <View style={styles.widgetHeaderRow}>
            <Text style={styles.widgetTitle}>Tóm tắt ca hôm nay</Text>
            <Pressable
              style={styles.viewTimesheetLink}
              onPress={() => router.push("/timesheet")}
              accessibilityRole="link"
            >
              <Text style={styles.viewTimesheetLinkText}>Bảng công</Text>
              <MaterialIcons
                name="chevron-right"
                size={16}
                color={colors.primary}
              />
            </Pressable>
          </View>

          <View style={styles.widgetGrid}>
            <View style={styles.widgetCard}>
              <Text style={styles.widgetCardLabel}>Giờ vào</Text>
              <Text style={styles.widgetCardValue}>
                {formatTime(todayData?.checkInAt)}
              </Text>
              <Text style={styles.widgetCardSub}>
                {todayData?.checkedIn ? "Đã check-in" : "Chưa vào"}
              </Text>
            </View>

            <View style={styles.widgetCard}>
              <Text style={styles.widgetCardLabel}>Giờ ra</Text>
              <Text style={styles.widgetCardValue}>
                {formatTime(todayData?.checkOutAt)}
              </Text>
              <Text style={styles.widgetCardSub}>
                {todayData?.checkedOut ? "Đã check-out" : "Chưa ra"}
              </Text>
            </View>

            <View style={styles.widgetCard}>
              <Text style={styles.widgetCardLabel}>Giờ làm</Text>
              <Text style={styles.widgetCardValue}>
                {todayData?.workingMinutes != null
                  ? `${Math.round((todayData.workingMinutes / 60) * 10) / 10}h`
                  : todayData?.checkedIn
                    ? "Đang làm"
                    : "0h"}
              </Text>
              <Text style={styles.widgetCardSub}>
                {todayData?.checkedOut
                  ? "Đã chốt ca"
                  : todayData?.checkedIn
                    ? "Tích luỹ"
                    : "Tiêu chuẩn"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Checkout Dialog */}
      <ConfirmCheckoutModal
        visible={confirmModalVisible}
        loading={isActionLoading}
        checkInAt={todayData?.checkInAt}
        onCancel={() => setConfirmModalVisible(false)}
        onConfirm={handleConfirmCheckOut}
      />

      {/* Punch Summary Modal */}
      <PunchSummaryModal
        visible={summaryData !== null}
        data={summaryData}
        onClose={() => setSummaryData(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing["3xl"],
  },
  topBarContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  greetingContainer: {
    flex: 1,
    justifyContent: "center",
  },
  greetingTitle: {
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  errorBox: {
    backgroundColor: colors.dangerSubtle,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  errorTitle: {
    flex: 1,
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.danger,
  },
  errorCloseBtn: {
    padding: spacing.xxs,
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight * 1.25,
    marginTop: spacing.xxs,
  },
  errorActionBtn: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
  },
  errorActionText: {
    color: "#FFFFFF",
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
  },
  summaryWidget: {
    marginTop: spacing.xl,
  },
  widgetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  widgetTitle: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  viewTimesheetLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: touchTargets.min,
    justifyContent: "center",
  },
  viewTimesheetLinkText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  widgetGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  widgetCard: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  widgetCardLabel: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  widgetCardValue: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  widgetCardSub: {
    fontSize: 10,
    color: colors.textDisabled,
    marginTop: 2,
  },
});
