import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors, radius, spacing, typography, touchTargets } from '../constants';

export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'text';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    const base: ViewStyle = {
      minHeight: touchTargets.min,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: isDisabled ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto',
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: pressed ? colors.primaryHover : colors.primary,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: pressed ? colors.primarySubtle : 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: pressed ? '#B91C1C' : colors.danger,
        };
      case 'text':
        return {
          ...base,
          backgroundColor: pressed ? colors.primarySubtle : 'transparent',
        };
      default:
        return base;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'outline':
      case 'text':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [getContainerStyle(pressed), style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={styles.spinner}
        />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  spinner: {
    marginVertical: spacing.xxs,
  },
});
