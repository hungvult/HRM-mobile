import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing } from "../../constants";

export function PayrollSkeleton() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Featured Net Salary Skeleton Card */}
      <View style={styles.featuredCard}>
        <View style={styles.topRow}>
          <Animated.View
            style={[styles.placeholder, styles.titleSkeleton, animatedStyle]}
          />
          <Animated.View
            style={[styles.placeholder, styles.badgeSkeleton, animatedStyle]}
          />
        </View>

        <View style={styles.amountBox}>
          <Animated.View
            style={[styles.placeholder, styles.labelSkeleton, animatedStyle]}
          />
          <Animated.View
            style={[styles.placeholder, styles.amountSkeleton, animatedStyle]}
          />
        </View>

        <Animated.View
          style={[styles.placeholder, styles.buttonSkeleton, animatedStyle]}
        />
      </View>

      {/* List item skeletons */}
      <View style={styles.listSection}>
        <Animated.View
          style={[
            styles.placeholder,
            styles.sectionTitleSkeleton,
            animatedStyle,
          ]}
        />

        {[1, 2, 3].map((key) => (
          <View key={key} style={styles.itemCard}>
            <View style={styles.itemLeft}>
              <Animated.View
                style={[
                  styles.placeholder,
                  styles.itemMonthSkeleton,
                  animatedStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.placeholder,
                  styles.itemDateSkeleton,
                  animatedStyle,
                ]}
              />
            </View>

            <View style={styles.itemRight}>
              <Animated.View
                style={[
                  styles.placeholder,
                  styles.itemAmountSkeleton,
                  animatedStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.placeholder,
                  styles.itemBadgeSkeleton,
                  animatedStyle,
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
  placeholder: {
    backgroundColor: colors.border,
    borderRadius: radius.sm,
  },
  featuredCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  titleSkeleton: {
    width: 140,
    height: 22,
  },
  badgeSkeleton: {
    width: 80,
    height: 22,
    borderRadius: radius.full,
  },
  amountBox: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  labelSkeleton: {
    width: 70,
    height: 12,
    marginBottom: spacing.xs,
  },
  amountSkeleton: {
    width: 180,
    height: 32,
  },
  buttonSkeleton: {
    width: "100%",
    height: 36,
  },
  listSection: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitleSkeleton: {
    width: 120,
    height: 18,
    marginBottom: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: {
    gap: spacing.xs,
  },
  itemMonthSkeleton: {
    width: 110,
    height: 16,
  },
  itemDateSkeleton: {
    width: 80,
    height: 12,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  itemAmountSkeleton: {
    width: 100,
    height: 18,
  },
  itemBadgeSkeleton: {
    width: 60,
    height: 16,
    borderRadius: radius.full,
  },
});
