import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";
import { usePayslipDetail } from "../../hooks";
import {
  formatCurrency,
  formatDateTime,
  formatPeriodMonthYear,
  formatWorkingDuration,
} from "../../utils/formatters";

export function PayslipDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ payrollRunId?: string }>();
  const runId = params.payrollRunId ? Number(params.payrollRunId) : null;

  const { detail, isLoading, isRefreshing, error, errorCode, refresh, retry } =
    usePayslipDetail(runId);

  const handleBack = () => {
    router.back();
  };

  if (isLoading && !detail) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Đang tải chi tiết phiếu lương...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle 404 PAYSLIP_NOT_AVAILABLE
  if (errorCode === "PAYSLIP_NOT_AVAILABLE" || (error && errorCode === "404")) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.stateContainer}>
          <View style={[styles.iconCircle, styles.warningCircle]}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={colors.warning}
            />
          </View>
          <Text style={styles.stateTitle}>Phiếu lương chưa khả dụng</Text>
          <Text style={styles.stateDescription}>
            Kỳ lương này chưa được công bố hoặc bạn không có quyền truy cập. Vui
            lòng kiểm tra lại sau.
          </Text>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Quay lại danh sách kỳ lương"
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionButtonText}>
              Quay lại danh sách
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Handle other errors (network, server 500, etc.)
  if (error && !detail) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.stateContainer}>
          <View style={[styles.iconCircle, styles.errorCircle]}>
            <Ionicons
              name="cloud-offline-outline"
              size={48}
              color={colors.danger}
            />
          </View>
          <Text style={styles.stateTitle}>Không thể tải chi tiết</Text>
          <Text style={styles.stateDescription}>{error}</Text>

          <View style={styles.errorButtonsRow}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retry}
              accessibilityRole="button"
              accessibilityLabel="Thử lại tải chi tiết phiếu lương"
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backOutlineButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Quay lại danh sách kỳ lương"
            >
              <Text style={styles.backOutlineButtonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return null;
  }

  const periodLabel = formatPeriodMonthYear(
    detail.period?.month,
    detail.period?.year,
  );
  const formattedPublishedAt = formatDateTime(detail.publishedAt);
  const totalEarnedIncome =
    (detail.amounts?.earnedBaseSalary ?? 0) +
    (detail.amounts?.earnedAllowance ?? 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Voucher Main Container */}
        <View style={styles.voucherCard}>
          {/* Voucher Header */}
          <View style={styles.voucherHeader}>
            <View style={styles.voucherHeaderTop}>
              <View style={styles.voucherHeaderTitleRow}>
                <Ionicons
                  name="receipt"
                  size={20}
                  color={colors.primary}
                  style={styles.voucherIcon}
                />
                <Text style={styles.voucherHeaderTitle}>
                  PHIẾU LƯƠNG CHI TIẾT
                </Text>
              </View>

              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>Đã công bố</Text>
              </View>
            </View>

            <Text style={styles.periodText}>{periodLabel}</Text>
            {formattedPublishedAt ? (
              <Text style={styles.publishedAtText}>
                Ngày công bố: {formattedPublishedAt}
              </Text>
            ) : null}
          </View>

          {/* Section 1: Thông tin nhân viên */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Thông tin nhân viên</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ và tên</Text>
              <Text style={styles.infoValue}>
                {detail.employee?.fullName || "--"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã nhân viên</Text>
              <Text style={styles.infoValue}>
                {detail.employee?.employeeCode || "--"}
              </Text>
            </View>
            <View style={[styles.infoRow, styles.lastRow]}>
              <Text style={styles.infoLabel}>Phòng ban</Text>
              <Text style={styles.infoValue}>
                {detail.employee?.department?.name || "--"}
              </Text>
            </View>
          </View>

          {/* Section 2: Ngày công & Thời gian làm việc */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              Ngày công & Thời gian làm việc
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày công chuẩn tháng (C)</Text>
              <Text style={styles.infoValue}>
                {detail.work?.standardWorkingDays ?? 0} ngày
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Công hưởng lương thực tế (Q)</Text>
              <Text style={[styles.infoValue, styles.highlightValue]}>
                {detail.work?.paidWorkingDays ?? 0} ngày
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phút làm việc chuẩn/ngày</Text>
              <Text style={styles.infoValue}>
                {detail.work?.standardMinutesPerDay ?? 0} phút
              </Text>
            </View>
            <View style={[styles.infoRow, styles.lastRow]}>
              <Text style={styles.infoLabel}>Thời gian tính lương</Text>
              <Text style={[styles.infoValue, styles.highlightValue]}>
                {(detail.work?.paidMinutes ?? 0).toLocaleString("vi-VN")} phút (
                {formatWorkingDuration(detail.work?.paidMinutes ?? 0)})
              </Text>
            </View>
          </View>

          {/* Section 3: Bảng kê thu nhập */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Bảng kê thu nhập</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lương cơ bản tháng</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(detail.amounts?.baseSalaryMonthly ?? 0)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lương theo công</Text>
              <Text style={[styles.infoValue, styles.incomeValue]}>
                {formatCurrency(detail.amounts?.earnedBaseSalary ?? 0)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phụ cấp tháng</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(detail.amounts?.allowanceMonthly ?? 0)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phụ cấp thực tế</Text>
              <Text style={[styles.infoValue, styles.incomeValue]}>
                {formatCurrency(detail.amounts?.earnedAllowance ?? 0)}
              </Text>
            </View>
            <View style={[styles.infoRow, styles.summarySubRow]}>
              <Text style={styles.summarySubLabel}>Tổng thu nhập thực tế</Text>
              <Text style={[styles.summarySubValue, styles.incomeValue]}>
                {formatCurrency(totalEarnedIncome)}
              </Text>
            </View>
          </View>

          {/* Section 4: Bảng kê khấu trừ */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Bảng kê khấu trừ</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Khấu trừ tháng</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(detail.amounts?.deductionMonthly ?? 0)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Khấu trừ thực tế</Text>
              <Text style={[styles.infoValue, styles.deductionValue]}>
                {(detail.amounts?.earnedDeduction ?? 0) > 0
                  ? `-${formatCurrency(detail.amounts?.earnedDeduction ?? 0)}`
                  : formatCurrency(0)}
              </Text>
            </View>
            <View style={[styles.infoRow, styles.summarySubRow]}>
              <Text style={styles.summarySubLabel}>
                Tổng các khoản khấu trừ
              </Text>
              <Text style={[styles.summarySubValue, styles.deductionValue]}>
                {(detail.amounts?.earnedDeduction ?? 0) > 0
                  ? `-${formatCurrency(detail.amounts?.earnedDeduction ?? 0)}`
                  : formatCurrency(0)}
              </Text>
            </View>
          </View>

          {/* Section 5: Khối Thực lĩnh (Net Salary) */}
          <View style={styles.netSalaryContainer}>
            <Text style={styles.netSalaryLabel}>SỐ TIỀN THỰC LĨNH</Text>
            <Text style={styles.netSalaryAmount}>
              {formatCurrency(detail.amounts?.netSalary ?? 0)}
            </Text>
            <Text style={styles.netSalaryFormula}>
              (Lương theo công + Phụ cấp thực tế - Khấu trừ thực tế)
            </Text>
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.bottomBackButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách kỳ lương"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.bottomBackButtonText}>
            Quay lại danh sách kỳ lương
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  warningCircle: {
    backgroundColor: colors.warningSubtle,
  },
  errorCircle: {
    backgroundColor: colors.dangerSubtle,
  },
  stateTitle: {
    fontSize: typography.lg.fontSize,
    lineHeight: typography.lg.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  stateDescription: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minHeight: touchTargets.min,
    gap: spacing.xs,
  },
  primaryActionButtonText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: "#FFFFFF",
  },
  errorButtonsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minHeight: touchTargets.min,
    gap: spacing.xs,
  },
  retryButtonText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: "#FFFFFF",
  },
  backOutlineButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minHeight: touchTargets.min,
  },
  backOutlineButtonText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  voucherCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  voucherHeader: {
    backgroundColor: colors.primarySubtle,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  voucherHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  voucherHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  voucherIcon: {
    marginRight: spacing.xs,
  },
  voucherHeaderTitle: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  badgeText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.success,
  },
  periodText: {
    fontSize: typography["2xl"].fontSize,
    lineHeight: typography["2xl"].lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  publishedAtText: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
  },
  sectionContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  lastRow: {
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  infoValue: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    textAlign: "right",
  },
  highlightValue: {
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  incomeValue: {
    color: colors.success,
    fontWeight: typography.weights.semibold,
  },
  deductionValue: {
    color: colors.danger,
    fontWeight: typography.weights.semibold,
  },
  summarySubRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summarySubLabel: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  summarySubValue: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  netSalaryContainer: {
    backgroundColor: colors.bgApp,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  netSalaryLabel: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.xxs,
  },
  netSalaryAmount: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: typography.weights.bold,
    color: colors.primaryHover,
    marginBottom: spacing.xxs,
  },
  netSalaryFormula: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
  },
  bottomBackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    minHeight: touchTargets.min,
    gap: spacing.xs,
  },
  bottomBackButtonText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});
