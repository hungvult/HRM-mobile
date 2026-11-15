import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";

export interface PeriodSelectorProps {
  selectedYear: number;
  selectedMonth: number;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
}

/** Chọn đúng năm và một trong 12 tháng; giữ tháng khi đổi năm, không có lựa chọn tất cả kỳ. */
export function PeriodSelector({
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
}: PeriodSelectorProps) {
  return (
    <View style={styles.wrapper}>
      {/* Năm tăng/giảm độc lập, giới hạn 2000–2100 theo bộ kiểm tra year của API. */}
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.pill}
          disabled={selectedYear <= 2000}
          onPress={() => onSelectYear(selectedYear - 1)}
          accessibilityRole="button"
          accessibilityLabel="Năm trước"
        >
          <Text>‹</Text>
        </TouchableOpacity>
        <Text style={styles.year} accessibilityLiveRegion="polite">
          Năm {selectedYear}
        </Text>
        <TouchableOpacity
          style={styles.pill}
          disabled={selectedYear >= 2100}
          onPress={() => onSelectYear(selectedYear + 1)}
          accessibilityRole="button"
          accessibilityLabel="Năm sau"
        >
          <Text>›</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
          <TouchableOpacity
            key={month}
            style={[styles.pill, month === selectedMonth && styles.active]}
            onPress={() => onSelectMonth(month)}
            accessibilityRole="button"
            accessibilityLabel={`Tháng ${month}, năm ${selectedYear}`}
            accessibilityState={{ selected: month === selectedMonth }}
          >
            <Text
              style={[
                styles.text,
                month === selectedMonth && styles.activeText,
              ]}
            >
              Tháng {month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  container: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pill: {
    minHeight: touchTargets.min,
    minWidth: touchTargets.min,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: colors.primary },
  text: { fontSize: typography.sm.fontSize, color: colors.textSecondary },
  activeText: { color: "#FFFFFF" },
  year: {
    flex: 1,
    textAlign: "center",
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
});
