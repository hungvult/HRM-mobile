import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../../constants";
import { NotificationItem } from "../../types";
import { formatRelativeTime, getNotificationTypeConfig } from "../../utils";

export interface NotificationItemCardProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}

export function NotificationItemCard({
  item,
  onPress,
}: NotificationItemCardProps) {
  const isUnread = !item.read;
  const typeConfig = getNotificationTypeConfig(item.type);
  const timeFormatted = formatRelativeTime(item.createdAt);
  const isLeaveRequest =
    item.relatedEntity?.type === "LEAVE_REQUEST" && !!item.relatedEntity?.id;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.container,
        isUnread ? styles.unreadContainer : styles.readContainer,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${timeFormatted}, ${isUnread ? "chưa đọc" : "đã đọc"}`}
    >
      {/* Icon based on notification type */}
      <View
        style={[styles.iconContainer, { backgroundColor: typeConfig.iconBg }]}
      >
        <Ionicons
          name={typeConfig.icon}
          size={22}
          color={typeConfig.iconColor}
        />
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              isUnread ? styles.unreadTitle : styles.readTitle,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {isUnread && <View style={styles.unreadDot} />}
        </View>

        <Text
          style={[
            styles.message,
            isUnread ? styles.unreadMessage : styles.readMessage,
          ]}
          numberOfLines={3}
        >
          {item.content}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.timeText}>{timeFormatted}</Text>

          {isLeaveRequest && (
            <View style={styles.actionHintRow}>
              <Text style={styles.actionHintText}>Xem đơn</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.primary}
              />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  unreadContainer: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  readContainer: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderLeftWidth: 1,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: colors.primarySubtle,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    marginRight: spacing.xs,
  },
  unreadTitle: {
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  readTitle: {
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
  },
  message: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    marginBottom: spacing.xs,
  },
  unreadMessage: {
    color: colors.textPrimary,
  },
  readMessage: {
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  timeText: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.textDisabled,
  },
  actionHintRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionHintText: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.primary,
    marginRight: 2,
    fontWeight: typography.weights.semibold,
  },
});
