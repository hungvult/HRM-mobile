import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../button";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";
import { formatDate } from "../../utils";

export interface DateRangePickerModalProps {
  visible: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
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

export function DateRangePickerModal({
  visible,
  startDate,
  endDate,
  onClose,
  onApply,
}: DateRangePickerModalProps) {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => formatIso(today), [today]);

  // Selected range in local modal state
  const [tempStart, setTempStart] = useState<string>(startDate || todayIso);
  const [tempEnd, setTempEnd] = useState<string>(
    endDate || startDate || todayIso,
  );
  const [isSelectingEnd, setIsSelectingEnd] = useState<boolean>(false);

  // Viewed calendar month & year
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth() + 1);

  // Sync state when modal opens
  useEffect(() => {
    if (visible) {
      const initialStart =
        startDate && startDate >= todayIso ? startDate : todayIso;
      const initialEnd =
        endDate && endDate >= initialStart ? endDate : initialStart;
      setTempStart(initialStart);
      setTempEnd(initialEnd);
      setIsSelectingEnd(false);

      // Navigate to month of start date
      const d = parseIso(initialStart);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth() + 1);
      } else {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth() + 1);
      }
    }
  }, [visible, startDate, endDate, today, todayIso]);

  // Month navigation
  const isViewingCurrentMonth = useMemo(() => {
    return (
      viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1
    );
  }, [viewYear, viewMonth, today]);

  const canGoPrevious = useMemo(() => {
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    if (viewYear > curYear) return true;
    return viewYear === curYear && viewMonth > curMonth;
  }, [viewYear, viewMonth, today]);

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
      isPast: boolean;
      isWeekend: boolean;
      isToday: boolean;
    }> = [];

    // Empty preceding cells for offset
    for (let i = 0; i < startDayOffset; i++) {
      cells.push({
        dayNumber: 0,
        dateStr: "",
        isCurrentMonth: false,
        isPast: true,
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
      const isPast = dateStr < todayIso;
      const isToday = dateStr === todayIso;

      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isPast,
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
          isPast: true,
          isWeekend: false,
          isToday: false,
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, todayIso]);

  // Group cells into 7-day rows to guarantee strict alignment under weekday columns
  const weeks = useMemo(() => {
    const rows: (typeof calendarCells)[] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      rows.push(calendarCells.slice(i, i + 7));
    }
    return rows;
  }, [calendarCells]);

  // Date click handler
  const handleSelectDate = (dateStr: string) => {
    if (!dateStr || dateStr < todayIso) return;

    if (!isSelectingEnd) {
      // Step 1: User selects start date
      setTempStart(dateStr);
      setTempEnd(dateStr);
      setIsSelectingEnd(true);
    } else {
      // Step 2: User selects end date
      if (dateStr < tempStart) {
        // Tapped a date before current start date -> make it new start date
        setTempStart(dateStr);
        setTempEnd(dateStr);
        setIsSelectingEnd(true);
      } else {
        // Tapped a date on or after start date -> set end date
        setTempEnd(dateStr);
        setIsSelectingEnd(false);
      }
    }
  };

  const handleApply = () => {
    onApply(tempStart, tempEnd);
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
              <Text style={styles.modalTitle}>Chọn thời gian nghỉ</Text>
              <Text style={styles.modalSubtitle}>
                {isSelectingEnd
                  ? "Chạm chọn ngày kết thúc"
                  : "Chạm chọn ngày bắt đầu"}
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

          {/* Range Preview Box */}
          <View style={styles.rangePreviewBox}>
            <Pressable
              onPress={() => setIsSelectingEnd(false)}
              style={[
                styles.rangePill,
                !isSelectingEnd && styles.rangePillActive,
              ]}
            >
              <Text style={styles.rangePillLabel}>Từ ngày</Text>
              <Text
                style={[
                  styles.rangePillValue,
                  !isSelectingEnd && styles.rangePillValueActive,
                ]}
              >
                {formatDate(tempStart)}
              </Text>
            </Pressable>

            <View style={styles.rangeArrow}>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.textSecondary}
              />
            </View>

            <Pressable
              onPress={() => setIsSelectingEnd(true)}
              style={[
                styles.rangePill,
                isSelectingEnd && styles.rangePillActive,
              ]}
            >
              <Text style={styles.rangePillLabel}>Đến ngày</Text>
              <Text
                style={[
                  styles.rangePillValue,
                  isSelectingEnd && styles.rangePillValueActive,
                ]}
              >
                {formatDate(tempEnd)}
              </Text>
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

                  const isStart = cell.dateStr === tempStart;
                  const isEnd = cell.dateStr === tempEnd;
                  const isInRange =
                    tempStart &&
                    tempEnd &&
                    cell.dateStr > tempStart &&
                    cell.dateStr < tempEnd;
                  const isSingleDaySelected = isStart && isEnd;

                  return (
                    <View key={cell.dateStr} style={styles.dayCellWrapper}>
                      {/* Range background strip */}
                      {isInRange && <View style={styles.rangeStrip} />}
                      {isStart && !isSingleDaySelected && (
                        <View style={styles.rangeStripStart} />
                      )}
                      {isEnd && !isSingleDaySelected && (
                        <View style={styles.rangeStripEnd} />
                      )}

                      <Pressable
                        disabled={cell.isPast}
                        onPress={() => handleSelectDate(cell.dateStr)}
                        style={({ pressed }) => [
                          styles.dayButton,
                          (isStart || isEnd) && styles.dayButtonSelected,
                          cell.isToday &&
                            !(isStart || isEnd) &&
                            styles.dayButtonToday,
                          cell.isPast && styles.dayButtonPast,
                          pressed && !cell.isPast && { opacity: 0.7 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Ngày ${cell.dayNumber}`}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            cell.isWeekend && styles.dayWeekendText,
                            (isStart || isEnd) && styles.dayTextSelected,
                            cell.isToday &&
                              !(isStart || isEnd) &&
                              styles.dayTextToday,
                            cell.isPast && styles.dayTextPast,
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
              title="Áp dụng thời gian này"
              onPress={handleApply}
              style={styles.applyButton}
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
  rangePreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangePill: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  rangePillActive: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  rangePillLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  rangePillValue: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  rangePillValueActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  rangeArrow: {
    paddingHorizontal: spacing.xs,
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
    marginBottom: spacing.md,
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
    position: "relative",
  },
  rangeStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 3,
    bottom: 3,
    backgroundColor: colors.primarySubtle,
  },
  rangeStripStart: {
    position: "absolute",
    left: "50%",
    right: 0,
    top: 3,
    bottom: 3,
    backgroundColor: colors.primarySubtle,
  },
  rangeStripEnd: {
    position: "absolute",
    left: 0,
    right: "50%",
    top: 3,
    bottom: 3,
    backgroundColor: colors.primarySubtle,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
  },
  dayButtonToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayButtonPast: {
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
  dayTextPast: {
    color: colors.textDisabled,
  },
  buttonGroup: {
    gap: spacing.xs,
  },
  applyButton: {
    width: "100%",
  },
  cancelButton: {
    width: "100%",
  },
});
