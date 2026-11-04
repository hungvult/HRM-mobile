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
  selectedYear: number | null;
  years: number[];
  onSelectYear: (year: number | null) => void;
}

export function PeriodSelector({
  selectedYear,
  years,
  onSelectYear,
}: PeriodSelectorProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity
          style={[
            styles.pill,
            selectedYear === null ? styles.pillActive : styles.pillInactive,
          ]}
          onPress={() => onSelectYear(null)}
          accessibilityRole="button"
          accessibilityLabel="Bộ lọc: Tất cả các năm"
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pillText,
              selectedYear === null
                ? styles.pillTextActive
                : styles.pillTextInactive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>

        {years.map((year) => {
          const isSelected = selectedYear === year;
          return (
            <TouchableOpacity
              key={year}
              style={[
                styles.pill,
                isSelected ? styles.pillActive : styles.pillInactive,
              ]}
              onPress={() => onSelectYear(year)}
              accessibilityRole="button"
              accessibilityLabel={`Bộ lọc: Năm ${year}`}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    minHeight: 36,
    minWidth: touchTargets.min,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillInactive: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: typography.weights.semibold,
  },
  pillTextInactive: {
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
  },
});
