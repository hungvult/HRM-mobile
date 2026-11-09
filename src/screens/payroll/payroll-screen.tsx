import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  MainTopBar,
  NetSalaryCard,
  PayrollEmptyState,
  PayrollSkeleton,
  PeriodSelector,
} from "../../components";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";
import { usePayroll } from "../../hooks";
import { MyPayslipSummaryItem } from "../../types";
import {
  formatCurrency,
  formatDate,
  formatPeriodMonthYear,
} from "../../utils/formatters";

export function PayrollScreen() {
  const router = useRouter();

  const {
    selectedYear,
    availableYears,
    payslips,
    isAmountHidden,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    totalElements,
    setSelectedYear,
    toggleAmountVisibility,
    refresh,
    loadMore,
    retry,
  } = usePayroll();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleOpenDetail = useCallback(
    (payrollRunId: number) => {
      router.push({
        pathname: "/payslip-detail",
        params: { payrollRunId: String(payrollRunId) },
      });
    },
    [router],
  );

  const renderHeader = useCallback(() => {
    if (payslips.length === 0) return null;

    const latestPayslip = payslips[0];

    return (
      <View style={styles.listHeaderContainer}>
        {/* Latest Payslip Featured Card */}
        <NetSalaryCard
          payslip={latestPayslip}
          isAmountHidden={isAmountHidden}
          onToggleHideAmount={toggleAmountVisibility}
          onPressDetail={() => handleOpenDetail(latestPayslip.payrollRunId)}
        />

        {/* Section title */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Lịch sử kỳ lương</Text>
            {totalElements > 0 && (
              <Text style={styles.totalBadge}>({totalElements})</Text>
            )}
          </View>
        </View>
      </View>
    );
  }, [
    payslips,
    isAmountHidden,
    totalElements,
    toggleAmountVisibility,
    handleOpenDetail,
  ]);

  const renderPayslipItem = useCallback(
    ({ item }: { item: MyPayslipSummaryItem }) => {
      const periodLabel = formatPeriodMonthYear(item.month, item.year);
      const displayAmount = isAmountHidden
        ? "•••••••• ₫"
        : formatCurrency(item.netSalary);
      const formattedDate = formatDate(item.publishedAt);

      return (
        <TouchableOpacity
          style={styles.payslipCard}
          onPress={() => handleOpenDetail(item.payrollRunId)}
          accessibilityRole="button"
          accessibilityLabel={`Kỳ lương ${periodLabel}, thực lĩnh ${displayAmount}`}
          activeOpacity={0.7}
        >
          <View style={styles.cardLeft}>
            <Text style={styles.cardPeriodTitle}>{periodLabel}</Text>
            {formattedDate ? (
              <Text style={styles.cardDateText}>Công bố: {formattedDate}</Text>
            ) : null}
            <View style={styles.itemBadge}>
              <View style={styles.itemBadgeDot} />
              <Text style={styles.itemBadgeText}>Đã công bố</Text>
            </View>
          </View>

          <View style={styles.cardRight}>
            <Text style={styles.cardAmountText} numberOfLines={1}>
              {displayAmount}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
              style={styles.chevronIcon}
            />
          </View>
        </TouchableOpacity>
      );
    },
    [isAmountHidden, handleOpenDetail],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerLoaderText}>Đang tải thêm...</Text>
      </View>
    );
  }, [isLoadingMore]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top bar */}
      <MainTopBar title="Phiếu lương cá nhân" />

      {/* Year Filter Chips */}
      <PeriodSelector
        selectedYear={selectedYear}
        years={availableYears}
        onSelectYear={setSelectedYear}
      />

      {/* Content states */}
      {isLoading && payslips.length === 0 ? (
        <PayrollSkeleton />
      ) : error && payslips.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.danger}
          />
          <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retry}
            accessibilityRole="button"
            accessibilityLabel="Thử lại tải dữ liệu phiếu lương"
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : payslips.length === 0 ? (
        <PayrollEmptyState selectedYear={selectedYear} onRefresh={refresh} />
      ) : (
        <FlatList
          data={payslips}
          keyExtractor={(item) => String(item.payrollRunId)}
          renderItem={renderPayslipItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  listContent: {
    paddingBottom: spacing["3xl"],
  },
  listHeaderContainer: {
    paddingBottom: spacing.xs,
  },
  sectionHeaderRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  totalBadge: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  payslipCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: touchTargets.min,
  },
  cardLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardPeriodTitle: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  cardDateText: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xxs,
  },
  itemBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.successSubtle,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 2,
  },
  itemBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  itemBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.medium,
    color: colors.success,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardAmountText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginRight: spacing.xxs,
  },
  chevronIcon: {
    marginLeft: spacing.xxs,
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  footerLoaderText: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["3xl"],
  },
  errorTitle: {
    fontSize: typography.lg.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minHeight: touchTargets.min,
    gap: spacing.xs,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
  },
});
