import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../button";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";
import { formatDate, formatFullWorkDate } from "../../utils";

export interface DatePickerModalProps {
  visible: boolean;
  title: string;
  selectedDate: string; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(isoStr: string): Date {
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function DatePickerModal({
  visible,
  title,
  selectedDate,
  minDate,
  onClose,
  onSelectDate,
}: DatePickerModalProps) {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => formatIso(today), [today]);

  // The effective minimum date allowed (cannot be in the past)
  const effectiveMinDate = useMemo(() => {
    if (!minDate || minDate < todayIso) {
      return todayIso;
    }
    return minDate;
  }, [minDate, todayIso]);

  // Local selection in modal
  const [currentSelected, setCurrentSelected] = useState<string>(
    selectedDate && selectedDate >= effectiveMinDate
      ? selectedDate
      : effectiveMinDate,
  );

  // Viewed calendar month & year
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth() + 1);

  // Sync state when modal becomes visible
  useEffect(() => {
    if (visible) {
      const initial =
        selectedDate && selectedDate >= effectiveMinDate
          ? selectedDate
          : effectiveMinDate;
      setCurrentSelected(initial);

      // Auto-navigate to month of selected date
      const d = parseIso(initial);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth() + 1);
      } else {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth() + 1);
      }
    }
  }, [visible, selectedDate, effectiveMinDate, today]);

  // Month navigation boundary
  const isViewingCurrentMonth = useMemo(() => {
    return (
      viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1
    );
  }, [viewYear, viewMonth, today]);

  const canGoPrevious = useMemo(() => {
    const minD = parseIso(effectiveMinDate);
    if (isNaN(minD.getTime())) return true;
    const minYear = minD.getFullYear();
    const minMonth = minD.getMonth() + 1;
    if (viewYear > minYear) return true;
    return viewYear === minYear && viewMonth > minMonth;
  }, [viewYear, viewMonth, effectiveMinDate]);

  const handlePrevMonth = () => {
    if (!canGoPrevious) return;
    if (viewMonth === 1) {
      setViewYear((prev) => prev - 1);
      setViewMonth(12);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((prev) => prev + 1);
      setViewMonth(1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth() + 1);
    if (todayIso >= effectiveMinDate) {
      setCurrentSelected(todayIso);
    }
  };

  // Generate calendar days
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1);
    const totalDays = new Date(viewYear, viewMonth, 0).getDate();

    // Monday as 0, Sunday as 6
    const startDayOffset = (firstDay.getDay() + 6) % 7;

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isWeekend: boolean;
      isToday: boolean;
    }> = [];

    // Empty preceding cells for offset
    for (let i = 0; i < startDayOffset; i++) {
      cells.push({
        dayNumber: 0,
        dateStr: "",
        isCurrentMonth: false,
        isDisabled: true,
        isWeekend: false,
        isToday: false,
      });
    }

    // Days in viewed month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayDate = new Date(viewYear, viewMonth - 1, d);
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isDisabled = dateStr < effectiveMinDate;
      const isToday = dateStr === todayIso;

      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isDisabled,
        isWeekend,
        isToday,
      });
    }

    // Empty trailing cells to complete the last week row
    const remainder = cells.length % 7;
    if (remainder > 0) {
      const trailingNeeded = 7 - remainder;
      for (let i = 0; i < trailingNeeded; i++) {
        cells.push({
          dayNumber: 0,
          dateStr: "",
          isCurrentMonth: false,
          isDisabled: true,
          isWeekend: false,
          isToday: false,
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, effectiveMinDate, todayIso]);

  // Group cells into 7-day rows to guarantee strict alignment under weekday columns
  const weeks = useMemo(() => {
    const rows: (typeof calendarCells)[] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      rows.push(calendarCells.slice(i, i + 7));
    }
    return rows;
  }, [calendarCells]);

  const handleSelectDay = (dateStr: string) => {
    if (!dateStr || dateStr < effectiveMinDate) return;
    setCurrentSelected(dateStr);
  };

  const handleConfirm = () => {
    if (currentSelected) {
      onSelectDate(currentSelected);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>
                {currentSelected
                  ? `Ngày đang chọn: ${formatFullWorkDate(currentSelected)}`
                  : "Vui lòng chọn một ngày"}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Đóng lịch"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavRow}>
            <Pressable
              onPress={handlePrevMonth}
              disabled={!canGoPrevious}
              style={({ pressed }) => [
                styles.monthNavButton,
                !canGoPrevious && styles.monthNavButtonDisabled,
                pressed && canGoPrevious && styles.buttonPressed,
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Tháng trước"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={canGoPrevious ? colors.textPrimary : colors.textDisabled}
              />
            </Pressable>

            <View style={styles.monthTitleWrapper}>
              <Text style={styles.monthTitleText}>
                Tháng {String(viewMonth).padStart(2, "0")}/{viewYear}
              </Text>
              {!isViewingCurrentMonth && (
                <Pressable
                  onPress={handleGoToday}
                  style={styles.todayBadge}
                  hitSlop={6}
                >
                  <Text style={styles.todayBadgeText}>Hôm nay</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={handleNextMonth}
              style={({ pressed }) => [
                styles.monthNavButton,
                pressed && styles.buttonPressed,
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Tháng sau"
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((wd, index) => {
              const isWeekend = index >= 5;
              return (
                <View key={wd} style={styles.weekdayCell}>
                  <Text
                    style={[
                      styles.weekdayText,
                      isWeekend && styles.weekdayWeekendText,
                    ]}
                  >
                    {wd}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {weeks.map((week, weekIdx) => (
              <View key={`week-${weekIdx}`} style={styles.weekRow}>
                {week.map((cell, dayIdx) => {
                  if (!cell.isCurrentMonth) {
                    return (
                      <View
                        key={`empty-${weekIdx}-${dayIdx}`}
                        style={styles.dayCellWrapper}
                      />
                    );
                  }

                  const isSelected = cell.dateStr === currentSelected;

                  return (
                    <View key={cell.dateStr} style={styles.dayCellWrapper}>
                      <Pressable
                        disabled={cell.isDisabled}
                        onPress={() => handleSelectDay(cell.dateStr)}
                        style={({ pressed }) => [
                          styles.dayButton,
                          isSelected && styles.dayButtonSelected,
                          cell.isToday && !isSelected && styles.dayButtonToday,
                          cell.isDisabled && styles.dayButtonDisabled,
                          pressed && !cell.isDisabled && { opacity: 0.7 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Ngày ${cell.dayNumber}`}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            cell.isWeekend && styles.dayWeekendText,
                            isSelected && styles.dayTextSelected,
                            cell.isToday && !isSelected && styles.dayTextToday,
                            cell.isDisabled && styles.dayTextDisabled,
                          ]}
                        >
                          {cell.dayNumber}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <Button
              title="Xác nhận chọn ngày"
              onPress={handleConfirm}
              style={styles.confirmButton}
            />
            <Button
              title="Đóng"
              variant="outline"
              onPress={onClose}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContainer: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radius.lg * 1.5,
    borderTopRightRadius: radius.lg * 1.5,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.lg.fontSize,
    lineHeight: typography.lg.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  closeButton: {
    minHeight: touchTargets.min,
    minWidth: touchTargets.min,
    alignItems: "center",
    justifyContent: "center",
  },
  monthNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgApp,
  },
  monthNavButtonDisabled: {
    opacity: 0.3,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  monthTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  monthTitleText: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  todayBadge: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xxs,
  },
  weekdayText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  weekdayWeekendText: {
    color: colors.warning,
  },
  daysGrid: {
    marginBottom: spacing.lg,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayCellWrapper: {
    flex: 1,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
  },
  dayButtonToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayButtonDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: typography.sm.fontSize,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  dayWeekendText: {
    color: colors.textSecondary,
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: typography.weights.bold,
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  dayTextDisabled: {
    color: colors.textDisabled,
  },
  buttonGroup: {
    gap: spacing.xs,
  },
  confirmButton: {
    width: "100%",
  },
  cancelButton: {
    width: "100%",
  },
});
