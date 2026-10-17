import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  LeaveBalanceCard,
  LeaveRequestCard,
  LeaveStatusFilter,
} from "../../components";
import { colors, radius, spacing, typography } from "../../constants";
import { useLeaves } from "../../hooks";
import { LeaveRequestListItem } from "../../types";

export function LeavesScreen() {
  const router = useRouter();

  const {
    selectedYear,
    balances,
    isBalanceLoading,
    balanceError,
    goToPreviousYear,
    goToNextYear,
    retryBalances,

    filterStatus,
    setFilterStatus,
    requests,
    totalElements,
    isListLoading,
    isRefreshing,
    isLoadingMore,
    listError,
    loadMore,
    refresh,
    retryList,
  } = useLeaves();

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleOpenDetail = (item: LeaveRequestListItem) => {
    router.push({
      pathname: "/leave-detail",
      params: { id: String(item.id) },
    });
  };

  const handleOpenCreate = () => {
    router.push("/create-leave");
  };

  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Header Titles */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn từ & Nghỉ phép</Text>
        <Text style={styles.headerSubtitle}>
          Theo dõi số dư quỹ phép năm và quản lý đơn xin nghỉ
        </Text>
      </View>

      {/* Leave Balance Card */}
      <LeaveBalanceCard
        year={selectedYear}
        balances={balances}
        loading={isBalanceLoading}
        error={balanceError}
        onPreviousYear={goToPreviousYear}
        onNextYear={goToNextYear}
        onRetry={retryBalances}
      />

      {/* 5-Status Filter Pills */}
      <LeaveStatusFilter
        selectedStatus={filterStatus}
        onSelectStatus={setFilterStatus}
      />

      {/* Section Header with + Tạo đơn button (Profile style) */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Danh sách đơn</Text>
          {totalElements > 0 && (
            <Text style={styles.totalBadge}>({totalElements})</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.createButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handleOpenCreate}
          accessibilityRole="button"
          accessibilityLabel="Tạo đơn nghỉ phép"
        >
          <Text style={styles.createButtonText}>+ Tạo đơn</Text>
        </TouchableOpacity>
      </View>

      {/* Partial List Error */}
      {listError && requests.length === 0 && (
        <View style={styles.listErrorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={colors.danger}
            style={styles.listErrorIcon}
          />
          <View style={styles.listErrorContent}>
            <Text style={styles.listErrorText}>{listError}</Text>
            <Pressable onPress={retryList} style={styles.listRetryBtn}>
              <Text style={styles.listRetryText}>Thử lại</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Loading Skeleton/Spinner when switching filters */}
      {isListLoading && requests.length === 0 && !listError && (
        <View style={styles.listLoadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.listLoadingText}>Đang tải danh sách đơn...</Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isListLoading || listError) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="document-text-outline"
          size={48}
          color={colors.textDisabled}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>Chưa có đơn nghỉ phép</Text>
        <Text style={styles.emptySubtitle}>
          {filterStatus === "ALL"
            ? "Bạn chưa tạo đơn xin nghỉ phép nào."
            : "Không tìm thấy đơn nào ở trạng thái này."}
        </Text>
        <TouchableOpacity
          onPress={handleOpenCreate}
          style={styles.emptyActionBtn}
          accessibilityRole="button"
        >
          <Text style={styles.emptyActionText}>+ Tạo đơn mới ngay</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={styles.bottomSpacer} />;

    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Main FlatList */}
      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <LeaveRequestCard item={item} onPress={handleOpenDetail} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing["5xl"],
  },
  listHeaderContainer: {
    marginBottom: spacing.xs,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.xl.fontSize,
    lineHeight: typography.xl.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  totalBadge: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    marginLeft: spacing.xxs,
  },
  createButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
  },
  createButtonText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  listErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerSubtle,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  listErrorIcon: {
    marginRight: spacing.xs,
  },
  listErrorContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listErrorText: {
    flex: 1,
    fontSize: typography.xs.fontSize,
    color: colors.danger,
    marginRight: spacing.xs,
  },
  listRetryBtn: {
    backgroundColor: colors.danger,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  listRetryText: {
    color: "#FFFFFF",
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
  },
  listLoadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  listLoadingText: {
    marginTop: spacing.xs,
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
  },
  emptyContainer: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  emptyIcon: {
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptyActionBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primarySubtle,
  },
  emptyActionText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  loadMoreContainer: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  loadMoreText: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
