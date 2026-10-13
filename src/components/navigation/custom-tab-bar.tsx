import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { colors, radius, spacing } from "../../constants";
import { TabItem } from "./tab-item";

export interface CustomTabBarProps extends BottomTabBarProps {
  badgeCount?: number;
}

const PILL_WIDTH = 56;
const PILL_HEIGHT = 32;
const PILL_TOP = 6;
const TAB_BAR_CONTENT_HEIGHT = 58;

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  badgeCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const reducedMotion = useReducedMotion();

  const [containerWidth, setContainerWidth] = useState(0);
  const isFirstLayout = useRef(true);

  // Motion 2: Single sliding pill behind active tab icon (translateX, ~250ms, Easing.out(Easing.cubic))
  const pillTranslateX = useSharedValue(0);
  const pillOpacity = useSharedValue(0);

  const routeCount = state.routes.length;
  const tabWidth =
    containerWidth > 0 && routeCount > 0 ? containerWidth / routeCount : 0;
  const targetX =
    tabWidth > 0 ? state.index * tabWidth + (tabWidth - PILL_WIDTH) / 2 : 0;

  useEffect(() => {
    if (containerWidth === 0) return;

    if (reducedMotion) {
      pillTranslateX.value = targetX;
      pillOpacity.value = 1;
      return;
    }

    if (isFirstLayout.current) {
      pillTranslateX.value = targetX;
      pillOpacity.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });
      isFirstLayout.current = false;
    } else {
      pillTranslateX.value = withTiming(targetX, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
      pillOpacity.value = 1;
    }
  }, [
    state.index,
    containerWidth,
    targetX,
    reducedMotion,
    pillTranslateX,
    pillOpacity,
  ]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ translateX: pillTranslateX.value }],
  }));

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom: bottomInset,
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
        },
      ]}
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width;
        if (width > 0 && width !== containerWidth) {
          setContainerWidth(width);
        }
      }}
    >
      {/* Motion 2: Pill nền mờ trượt ngang giữa các tab */}
      <Animated.View
        pointerEvents="none"
        style={[styles.slidingPill, animatedPillStyle]}
      />

      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const options = descriptor?.options || {};
        const isFocused = state.index === index;

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const title = typeof label === "string" ? label : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        // Determine badge count (Đơn từ / leaves tab)
        let tabBadge = 0;
        if (typeof options.tabBarBadge === "number") {
          tabBadge = options.tabBarBadge;
        } else if (route.name === "leaves") {
          tabBadge = badgeCount;
        }

        return (
          <TabItem
            key={route.key}
            name={route.name}
            title={title}
            selected={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            badgeCount={tabBadge}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: colors.bgSurface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: PILL_TOP,
    position: "relative",
    // Modern & minimal elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 4,
  },
  slidingPill: {
    position: "absolute",
    top: PILL_TOP,
    left: 0,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.primaryPill,
    zIndex: 0,
  },
});
