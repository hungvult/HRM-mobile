import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, spacing, typography } from "../../constants";
import { NotificationBellButton } from "./notification-bell-button";

export interface MainTopBarProps {
  title?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  unreadCount?: number;
}

export function MainTopBar({
  title,
  leftContent,
  rightContent,
  containerStyle,
  unreadCount,
}: MainTopBarProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.leftContainer}>
        {leftContent
          ? leftContent
          : title && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}
      </View>

      <View style={styles.rightContainer}>
        {rightContent !== undefined ? (
          rightContent
        ) : (
          <NotificationBellButton count={unreadCount} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
  },
  leftContainer: {
    flex: 1,
    marginRight: spacing.md,
    justifyContent: "center",
  },
  rightContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.xl.fontSize,
    lineHeight: typography.xl.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
});
