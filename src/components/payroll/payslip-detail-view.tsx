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
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";
import { UsePayslipDetailResult } from "../../hooks/use-payroll";
import {
  formatCurrency,
  formatDateTime,
  formatPeriodMonthYear,
  formatWorkingDuration,
} from "../../utils/formatters";

interface PayslipDetailViewProps extends UsePayslipDetailResult {
  isAmountHidden: boolean;
  onToggleAmountVisibility: () => void;
  onBack?: () => void;
}

/**
 * Hiển thị cùng snapshot cho tab chọn tháng/năm và deep link theo ID đợt lương.
 * Chỉ hiển thị số tiền đã trả từ backend, không tính lại lương theo hồ sơ hiện tại.
 * Khi ẩn, thay nội dung Text bằng nhãn che nên trình đọc màn hình cũng không nhận số tiền gốc.
 * Loading/lỗi không render phiếu cũ; việc loại phản hồi khác kỳ thuộc hook bên gọi.
 */
export function PayslipDetailView({
  detail,
  isLoading,
  isRefreshing,
  error,
  availability,
  refresh,
  retry,
  isAmountHidden,
  onToggleAmountVisibility,
  onBack,
}: PayslipDetailViewProps) {
  // Chờ dữ liệu hoặc báo lỗi ngay trong màn đang chọn kỳ, không bắt đi qua danh sách.
  if (isLoading || isRefreshing)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Đang tải chi tiết phiếu lương...</Text>
      </View>
    );
  if (error || !detail) {
    const title =
      availability === "not-published"
        ? "Phiếu lương chưa công bố"
        : availability === "not-found"
          ? "Chưa có phiếu lương"
          : availability === "unavailable"
            ? "Phiếu lương chưa khả dụng"
            : "Không thể tải chi tiết";
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateDescription}>{error}</Text>
        <TouchableOpacity
          onPress={retry}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Thử lại tải chi tiết phiếu lương"
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backOutlineButton}
            accessibilityRole="button"
            accessibilityLabel="Quay lại phiếu lương"
          >
            <Text>Quay lại phiếu lương</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Mọi khoản tiền, kể cả tổng thu nhập và khấu trừ có dấu âm, đi qua cùng một nhãn che.
  const displayAmount = (amount: number) =>
    isAmountHidden ? "Số tiền đã ẩn" : formatCurrency(amount);
  const periodLabel = formatPeriodMonthYear(
    detail.period?.month,
    detail.period?.year,
  );
  const formattedPublishedAt = formatDateTime(detail.publishedAt);
  const totalEarnedIncome =
    (detail.amounts?.earnedBaseSalary ?? 0) +
    (detail.amounts?.earnedAllowance ?? 0);
  return (
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
      {/* Giữ cấu trúc phiếu cũ để tab chọn kỳ và deep link hiển thị cùng snapshot. */}
      <View style={styles.voucherCard}>
        {/* Kỳ và thời điểm công bố lấy từ snapshot backend đã trả. */}
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

          <TouchableOpacity
            onPress={onToggleAmountVisibility}
            accessibilityRole="button"
            accessibilityLabel={
              isAmountHidden ? "Hiện mọi số tiền" : "Ẩn mọi số tiền"
            }
            style={styles.backOutlineButton}
          >
            <Ionicons
              name={isAmountHidden ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.primary}
            />
            <Text>{isAmountHidden ? "Hiện số tiền" : "Ẩn số tiền"}</Text>
          </TouchableOpacity>
          <Text style={styles.periodText}>{periodLabel}</Text>
          {formattedPublishedAt ? (
            <Text style={styles.publishedAtText}>
              Ngày công bố: {formattedPublishedAt}
            </Text>
          ) : null}
        </View>

        {/* Thông tin nhân viên của phiếu, không lấy từ tài khoản hay hồ sơ đang thay đổi. */}
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

        {/* Ngày công và thời gian là snapshot của kỳ lương. */}
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

        {/* Che cả thu nhập từng dòng và số tổng khi người dùng tắt con mắt. */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Bảng kê thu nhập</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lương cơ bản tháng</Text>
            <Text style={styles.infoValue}>
              {displayAmount(detail.amounts?.baseSalaryMonthly ?? 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lương theo công</Text>
            <Text style={[styles.infoValue, styles.incomeValue]}>
              {displayAmount(detail.amounts?.earnedBaseSalary ?? 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phụ cấp tháng</Text>
            <Text style={styles.infoValue}>
              {displayAmount(detail.amounts?.allowanceMonthly ?? 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phụ cấp thực tế</Text>
            <Text style={[styles.infoValue, styles.incomeValue]}>
              {displayAmount(detail.amounts?.earnedAllowance ?? 0)}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.summarySubRow]}>
            <Text style={styles.summarySubLabel}>Tổng thu nhập thực tế</Text>
            <Text style={[styles.summarySubValue, styles.incomeValue]}>
              {displayAmount(totalEarnedIncome)}
            </Text>
          </View>
        </View>

        {/* Khấu trừ tháng/thực tế và tổng khấu trừ đều dùng nhãn che chung. */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Bảng kê khấu trừ</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Khấu trừ tháng</Text>
            <Text style={styles.infoValue}>
              {displayAmount(detail.amounts?.deductionMonthly ?? 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Khấu trừ thực tế</Text>
            <Text style={[styles.infoValue, styles.deductionValue]}>
              {(detail.amounts?.earnedDeduction ?? 0) > 0
                ? displayAmount(-(detail.amounts?.earnedDeduction ?? 0))
                : displayAmount(0)}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.summarySubRow]}>
            <Text style={styles.summarySubLabel}>Tổng các khoản khấu trừ</Text>
            <Text style={[styles.summarySubValue, styles.deductionValue]}>
              {(detail.amounts?.earnedDeduction ?? 0) > 0
                ? displayAmount(-(detail.amounts?.earnedDeduction ?? 0))
                : displayAmount(0)}
            </Text>
          </View>
        </View>

        {/* Thực lĩnh lấy trực tiếp từ snapshot đã công bố, không tính lại trên app. */}
        <View style={styles.netSalaryContainer}>
          <Text style={styles.netSalaryLabel}>SỐ TIỀN THỰC LĨNH</Text>
          <Text style={styles.netSalaryAmount}>
            {displayAmount(detail.amounts?.netSalary ?? 0)}
          </Text>
          <Text style={styles.netSalaryFormula}>
            (Lương theo công + Phụ cấp thực tế - Khấu trừ thực tế)
          </Text>
        </View>
      </View>

      {/* Deep link giữ nút quay lại, tab chọn kỳ không cần bước điều hướng này. */}
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backOutlineButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại phiếu lương"
        >
          <Text>Quay lại phiếu lương</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
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
});
