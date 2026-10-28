import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../constants";
import { formatVietnameseDate } from "../../utils";

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(currentTime.getHours()).padStart(2, "0");
  const minutes = String(currentTime.getMinutes()).padStart(2, "0");
  const seconds = String(currentTime.getSeconds()).padStart(2, "0");
  const timeString = `${hours}:${minutes}:${seconds}`;
  const dateString = formatVietnameseDate(currentTime);

  return (
    <View style={styles.container}>
      <Text style={styles.timeText} accessibilityRole="header">
        {timeString}
      </Text>
      <Text style={styles.dateText}>{dateString}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  timeText: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 1.5,
    fontVariant: ["tabular-nums"],
  },
  dateText: {
    marginTop: spacing.xs,
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
});
