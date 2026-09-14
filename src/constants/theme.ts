/**
 * Light Theme
 */

export const colors = {
  // Primary
  primary: '#1D4ED8',
  primaryHover: '#1E40AF',
  primarySubtle: '#EFF6FF',
  primarySubtleBorder: 'transparent',

  // Semantic
  success: '#16A34A',
  successSubtle: '#F0FDF4',
  warning: '#D97706',
  warningSubtle: '#FFFBEB',
  danger: '#DC2626',
  dangerSubtle: '#FEF2F2',

  // Neutrals & Surfaces (Light mode)
  bgApp: '#F9FAFB',
  bgSurface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const typography = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const touchTargets = {
  min: 44,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  touchTargets,
} as const;

export type Theme = typeof theme;
