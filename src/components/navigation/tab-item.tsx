import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from "../../constants";

export interface TabItemProps {
  name: string;
  title: string;
  selected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  badgeCount?: number;
}

const TAB_ICONS: Record<
  string,
  {
    filled: keyof typeof MaterialCommunityIcons.glyphMap;
    outlined: keyof typeof MaterialCommunityIcons.glyphMap;
  }
> = {
  index: { filled: "home", outlined: "home-outline" },
  timesheet: { filled: "calendar-month", outlined: "calendar-month-outline" },
  leaves: { filled: "file-document", outlined: "file-document-outline" },
  payroll: { filled: "wallet", outlined: "wallet-outline" },
  profile: { filled: "account", outlined: "account-outline" },
};

const ICON_SIZE = 24;

export const TabItem: React.FC<TabItemProps> = ({
  name,
  title,
  selected,
  onPress,
  onLongPress,
  badgeCount = 0,
}) => {
  const reducedMotion = useReducedMotion();

  // Shared values
  const activeProgress = useSharedValue(selected ? 1 : 0);
  const pressOpacity = useSharedValue(1);
  const badgeOpacity = useSharedValue(badgeCount > 0 ? 1 : 0);

  // Motion 1: Icon cross-fade (outlined -> filled, ~200ms) + Label color transition (~200ms)
  useEffect(() => {
    if (reducedMotion) {
      activeProgress.value = selected ? 1 : 0;
      return;
    }

    activeProgress.value = withTiming(selected ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, reducedMotion, activeProgress]);

  // Motion 4: Badge fade-in ~150ms (không pop; ẩn khi bằng 0)
  useEffect(() => {
    if (reducedMotion) {
      badgeOpacity.value = badgeCount > 0 ? 1 : 0;
      return;
    }

    badgeOpacity.value = withTiming(badgeCount > 0 ? 1 : 0, {
      duration: 150,
      easing: Easing.out(Easing.cubic),
    });
  }, [badgeCount, reducedMotion, badgeOpacity]);

  // Motion 3: Press feedback: giảm opacity xuống ~0.7 lúc press-in (không scale), trả về 1 lúc nhả
  const handlePressIn = () => {
    if (reducedMotion) {
      pressOpacity.value = 0.7;
      return;
    }
    pressOpacity.value = withTiming(0.7, {
      duration: 100,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      pressOpacity.value = 1;
      return;
    }
    pressOpacity.value = withTiming(1, {
      duration: 100,
      easing: Easing.out(Easing.cubic),
    });
  };

  // Animated styles
  const animatedPressStyle = useAnimatedStyle(() => ({
    opacity: pressOpacity.value,
  }));

  const animatedOutlinedIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - activeProgress.value,
  }));

  const animatedFilledIconStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return {
        color: selected ? colors.primary : colors.textSecondary,
      };
    }
    return {
      color: interpolateColor(
        activeProgress.value,
        [0, 1],
        [colors.textSecondary, colors.primary],
      ),
    };
  });

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
  }));

  const iconConfig = TAB_ICONS[name] || {
    filled: "circle",
    outlined: "circle-outline",
  };

  const badgeText = badgeCount > 99 ? "99+" : `${badgeCount}`;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}${badgeCount > 0 ? `, ${badgeCount} thông báo` : ""}`}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabPressable}
    >
      <Animated.View style={[styles.tabContent, animatedPressStyle]}>
        {/* Icon container */}
        <View style={styles.iconContainer}>
          {/* Motion 1: Cross-fade Outlined & Filled icons */}
          <Animated.View style={[styles.iconLayer, animatedOutlinedIconStyle]}>
            <MaterialCommunityIcons
              name={iconConfig.outlined}
              size={ICON_SIZE}
              color={colors.textSecondary}
            />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, animatedFilledIconStyle]}>
            <MaterialCommunityIcons
              name={iconConfig.filled}
              size={ICON_SIZE}
              color={colors.primary}
            />
          </Animated.View>

          {/* Motion 4: Badge fade-in */}
          {badgeCount > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.badge, animatedBadgeStyle]}
            >
              <Animated.Text style={styles.badgeText}>
                {badgeText}
              </Animated.Text>
            </Animated.View>
          )}
        </View>

        {/* Motion 1: Label đổi màu muted -> primary cùng nhịp */}
        <Animated.Text
          style={[
            styles.label,
            selected ? styles.labelActive : styles.labelInactive,
            animatedLabelStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tabPressable: {
    flex: 1,
    minHeight: touchTargets.min,
    minWidth: touchTargets.min,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  iconContainer: {
    width: 56,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.badgeBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    zIndex: 10,
  },
  badgeText: {
    color: colors.badgeText,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textAlign: "center",
    lineHeight: 12,
  },
  label: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    marginTop: spacing.xxs,
  },
  labelActive: {
    fontWeight: typography.weights.semibold,
  },
  labelInactive: {
    fontWeight: typography.weights.regular,
  },
});
