import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { colors, radius, spacing } from "../constants";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    width: "100%",
  },
});
