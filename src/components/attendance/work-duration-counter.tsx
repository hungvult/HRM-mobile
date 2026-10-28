import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextStyle, StyleProp } from "react-native";
import { colors, typography } from "../../constants";
import { formatLiveDuration } from "../../utils";

export interface WorkDurationCounterProps {
  checkInAt?: string | null;
  style?: StyleProp<TextStyle>;
}

export function WorkDurationCounter({
  checkInAt,
  style,
}: WorkDurationCounterProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!checkInAt) {
      setSeconds(0);
      return;
    }

    const start = new Date(checkInAt).getTime();
    if (isNaN(start)) {
      setSeconds(0);
      return;
    }

    const update = () => {
      setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [checkInAt]);

  return (
    <Text style={[styles.counterText, style]}>
      {formatLiveDuration(seconds)}
    </Text>
  );
}

const styles = StyleSheet.create({
  counterText: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.warning,
    fontVariant: ["tabular-nums"],
  },
});
