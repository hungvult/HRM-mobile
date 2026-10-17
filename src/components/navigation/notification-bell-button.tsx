import React, { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../../constants";
import { notificationService } from "../../services";

export interface NotificationBellButtonProps {
  count?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  color?: string;
  size?: number;
}

export function NotificationBellButton({
  count: propCount,
  onPress,
  style,
  color = colors.textPrimary,
  size = 24,
}: NotificationBellButtonProps) {
  const router = useRouter();
  const [internalCount, setInternalCount] = useState<number>(0);

  // Auto-fetch unread count whenever the parent screen gains focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (propCount === undefined) {
        notificationService
          .getUnreadCount()
          .then((res) => {
            if (isMounted) {
              setInternalCount(res.unreadCount ?? 0);
            }
          })
          .catch(() => {
            // Keep previous value on non-fatal network error
          });
      }
      return () => {
        isMounted = false;
      };
    }, [propCount]),
  );

  const displayCount = propCount !== undefined ? propCount : internalCount;
  const hasUnread = displayCount > 0;
  const badgeText = displayCount > 99 ? "99+" : String(displayCount);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/notifications");
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={
        hasUnread
          ? `Thông báo, ${displayCount} chưa đọc`
          : "Thông báo, không có thông báo chưa đọc"
      }
      style={({ pressed }) => [
        styles.buttonContainer,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {hasUnread && (
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {badgeText}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: colors.primarySubtle,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.badgeBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.bgSurface,
  },
  badgeText: {
    color: colors.badgeText,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 12,
  },
});
