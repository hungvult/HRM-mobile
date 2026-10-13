import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  CalendarGrid,
  DailyAttendanceItem,
  MonthSelector,
  TimesheetSummaryCard,
} from "../../components";
import { colors, radius, spacing, typography } from "../../constants";
import { useTimesheet } from "../../hooks";
import { formatWorkDate } from "../../utils";

export function TimesheetScreen() {
  const {
    selectedMonth,
    selectedDate,
    items,
    summary,
    isLoading,
    error,
    isCurrentMonth,
    refresh,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    setSelectedDate,
  } = useTimesheet();

  // Filter items if a specific date is clicked on calendar
  const displayedItems = selectedDate
    ? items.filter((item) => item.workDate === selectedDate)
    : items;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bảng công cá nhân</Text>
          <Text style={styles.headerSubtitle}>
            Theo dõi chi tiết ngày công và giờ làm việc theo tháng
          </Text>
        </View>

        {/* Month Selector Component */}
        <MonthSelector
          selectedMonth={selectedMonth}
          isCurrentMonth={isCurrentMonth}
          canGoNext={!isCurrentMonth}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
          onCurrentMonth={goToCurrentMonth}
        />

        {/* Error Notification */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Loading Spinner for Month Transitions */}
        {isLoading && items.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải bảng công...</Text>
          </View>
        )}

        {/* Monthly Summary Statistics */}
        {items.length > 0 && <TimesheetSummaryCard summary={summary} />}

        {/* Interactive Calendar Grid */}
        <CalendarGrid
          selectedMonth={selectedMonth}
          selectedDate={selectedDate}
          items={items}
          onSelectDate={(dateStr) => {
            if (selectedDate === dateStr) {
              setSelectedDate(null); // Unselect if tapped again
            } else {
              setSelectedDate(dateStr);
            }
          }}
        />

        {/* Daily Breakdown Section */}
        <View style={styles.breakdownSection}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.sectionTitle}>
              {selectedDate
                ? `Chi tiết ${formatWorkDate(selectedDate)}`
                : "Chi tiết các ngày làm việc"}
            </Text>

            {selectedDate && (
              <Pressable
                onPress={() => setSelectedDate(null)}
                style={({ pressed }) => [
                  styles.clearFilterButton,
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.clearFilterText}>Xem tất cả</Text>
              </Pressable>
            )}
          </View>

          {/* Empty State when no items in month */}
          {items.length === 0 && !isLoading && (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={colors.textDisabled}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
              <Text style={styles.emptySubtitle}>
                Không tìm thấy bản ghi chấm công nào trong tháng này.
              </Text>
            </View>
          )}

          {/* Empty State when a selected date has no check-in/out record */}
          {selectedDate && displayedItems.length === 0 && !isLoading && (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="time-outline"
                size={40}
                color={colors.textDisabled}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>Không có bản ghi</Text>
              <Text style={styles.emptySubtitle}>
                Ngày {formatWorkDate(selectedDate)} chưa ghi nhận chấm công.
              </Text>
            </View>
          )}

          {/* List of Daily Attendance Items */}
          {displayedItems.map((item) => (
            <DailyAttendanceItem
              key={item.workDate}
              item={item}
              isSelected={selectedDate === item.workDate}
            />
          ))}
        </View>
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
    padding: spacing.md,
    paddingBottom: spacing["4xl"],
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
  errorBox: {
    backgroundColor: colors.dangerSubtle,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.medium,
  },
  loadingContainer: {
    paddingVertical: spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
  },
  breakdownSection: {
    marginTop: spacing.xs,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  clearFilterButton: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  clearFilterText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  emptyContainer: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.sm,
  },
  emptyIcon: {
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  emptySubtitle: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
