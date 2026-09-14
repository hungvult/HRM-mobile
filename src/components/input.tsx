import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radius, spacing, typography, touchTargets } from '../constants';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  helperText,
  isPassword = false,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const [isSecure, setIsSecure] = useState<boolean>(isPassword);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const togglePasswordVisibility = () => {
    setIsSecure((prev) => !prev);
  };

  const getBorderColor = (): string => {
    if (error) return colors.danger;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: getBorderColor(),
            borderWidth: isFocused || error ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textDisabled}
          secureTextEntry={isPassword ? isSecure : false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={togglePasswordVisibility}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
          >
            <Text style={styles.eyeText}>{isSecure ? 'Hiện' : 'Ẩn'}</Text>
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    color: colors.textPrimary,
    minHeight: touchTargets.min,
    paddingVertical: spacing.xs,
  },
  eyeButton: {
    minHeight: touchTargets.min,
    minWidth: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  eyeText: {
    fontSize: typography.sm.fontSize,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  errorText: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.danger,
    marginTop: spacing.xxs,
  },
  helperText: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
