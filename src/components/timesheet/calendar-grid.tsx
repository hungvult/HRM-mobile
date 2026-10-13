import React, { useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Card } from "../card";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";
import { MonthlyAttendanceItem } from "../../types";
import { getAttendanceStatusConfig } from "../../utils";

export interface CalendarGridProps {
  selectedMonth: string; // YYYY-MM
  selectedDate: string | null; // YYYY-MM-DD
  items: MonthlyAttendanceItem[];
  onSelectDate: (dateStr: string) => void;
}

interface CalendarCell {
  dayNumber: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  statusConfig?: {
    label: string;
    bg: string;
    text: string;
  };
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function CalendarGrid({
  selectedMonth,
  selectedDate,
  items,
  onSelectDate,
}: CalendarGridProps) {
  // Map items by workDate for O(1) lookup
  const itemsMap = useMemo(() => {
    const map = new Map<string, MonthlyAttendanceItem>();
    for (const item of items) {
      map.set(item.workDate, item);
    }
    return map;
  }, [items]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const cells = useMemo<CalendarCell[]>(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    if (!year || !month) return [];

    const firstDay = new Date(year, month - 1, 1);
    const totalDays = new Date(year, month, 0).getDate();
    const prevMonthTotalDays = new Date(year, month - 1, 0).getDate();

    // Monday as 0, Sunday as 6
    const startDayOffset = (firstDay.getDay() + 6) % 7;

    const result: CalendarCell[] = [];

    // Preceding days from previous month
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      result.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const item = itemsMap.get(dateStr);
      result.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        statusConfig: item
          ? getAttendanceStatusConfig(item.attendanceStatus)
          : undefined,
      });
    }

    // Trailing days for next month to complete the last week
    const trailingCount = (7 - (result.length % 7)) % 7;
    for (let day = 1; day <= trailingCount; day++) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      result.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return result;
  }, [selectedMonth, itemsMap, todayStr]);

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Lịch Chấm Công</Text>

      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((name, index) => (
          <View key={name} style={styles.weekdayCol}>
            <Text
              style={[styles.weekdayText, index >= 5 && styles.weekendText]}
            >
              {name}
            </Text>
          </View>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.gridContainer}>
        {cells.map((cell) => {
          const isSelected = selectedDate === cell.dateStr;

          return (
            <Pressable
              key={cell.dateStr}
              onPress={() => cell.isCurrentMonth && onSelectDate(cell.dateStr)}
              disabled={!cell.isCurrentMonth}
              style={({ pressed }) => [
                styles.dayCell,
                !cell.isCurrentMonth && styles.dayCellOtherMonth,
                cell.isToday && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
                pressed && styles.dayCellPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Ngày ${cell.dayNumber}`}
            >
              <Text
                style={[
                  styles.dayText,
                  !cell.isCurrentMonth && styles.dayTextOtherMonth,
                  cell.isToday && styles.dayTextToday,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {cell.dayNumber}
              </Text>

              {/* Status indicator dot */}
              {cell.statusConfig ? (
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: cell.statusConfig.text },
                  ]}
                />
              ) : (
                <View style={styles.statusDotPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Legend / Chú thích trạng thái */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.success }]}
          />
          <Text style={styles.legendText}>Đã chấm công</Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.warning }]}
          />
          <Text style={styles.legendText}>Chưa chốt ca</Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.primary }]}
          />
          <Text style={styles.legendText}>Nghỉ phép</Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.danger }]}
          />
          <Text style={styles.legendText}>Vắng mặt</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#7E22CE" }]} />
          <Text style={styles.legendText}>Nghỉ lễ</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weekdayRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  weekdayCol: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  weekendText: {
    color: colors.textDisabled,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%", // 7 columns
    aspectRatio: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    borderColor: colors.primary,
  },
  dayCellSelected: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  dayCellPressed: {
    opacity: 0.7,
  },
  dayText: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  dayTextOtherMonth: {
    color: colors.textDisabled,
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  dayTextSelected: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    marginTop: 2,
  },
  statusDotPlaceholder: {
    width: 6,
    height: 6,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
