import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';

// === PEAK DESIGN SYSTEM ===

// 1.1 Color Palette
const colors = {
  // Primary - Vibrant Purple (User Requested)
  primary: '#7C3AED', // Violet 600
  primaryLight: '#A78BFA', // Violet 400
  primaryDark: '#5B21B6', // Violet 800
  primaryContainer: '#F3E8FF', // Violet 100
  onPrimary: '#FFFFFF',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutrals 
  background: '#F8FAFC', // Slate 50 - Clean light background
  surface: '#FFFFFF', // Pure White
  surfaceVariant: '#F1F5F9', // Slate 100
  outline: '#CBD5E1', // Slate 300
  outlineVariant: '#E2E8F0', // Slate 200

  // Text
  onBackground: '#0F172A', // Slate 900
  onSurface: '#0F172A', // Slate 900
  onSurfaceVariant: '#334155', // Slate 700
  textSecondary: '#64748B', // Slate 500
  textTertiary: '#94A3B8', // Slate 400

  // Special
  shadow: '#000000',
  scrim: '#000000',
  overlay: 'rgba(15, 23, 42, 0.5)',
};

// 1.2 Typography Scale
const typography = {
  displayLarge: {
    fontSize: 36, // text-4xl
    lineHeight: 44,
    fontWeight: '700' as const,
    fontFamily: 'Inter',
  },
  displayMedium: {
    fontSize: 30, // text-3xl
    lineHeight: 38,
    fontWeight: '700' as const,
    fontFamily: 'Inter',
  },
  displaySmall: {
    fontSize: 24, // text-2xl
    lineHeight: 32,
    fontWeight: '600' as const,
    fontFamily: 'Inter',
  },
  headlineLarge: {
    fontSize: 24, // text-2xl
    lineHeight: 32,
    fontWeight: '700' as const,
    fontFamily: 'Inter',
  },
  headlineMedium: {
    fontSize: 20, // text-xl
    lineHeight: 28,
    fontWeight: '600' as const,
    fontFamily: 'Inter',
  },
  headlineSmall: {
    fontSize: 18, // text-lg
    lineHeight: 26,
    fontWeight: '600' as const,
    fontFamily: 'Inter',
  },
  titleLarge: {
    fontSize: 18, // text-lg
    lineHeight: 26,
    fontWeight: '600' as const,
    fontFamily: 'Inter',
  },
  titleMedium: {
    fontSize: 16, // text-base
    lineHeight: 24,
    fontWeight: '500' as const,
    fontFamily: 'Inter',
  },
  titleSmall: {
    fontSize: 14, // text-sm
    lineHeight: 20,
    fontWeight: '500' as const,
    fontFamily: 'Inter',
  },
  bodyLarge: {
    fontSize: 16, // text-base
    lineHeight: 24,
    fontWeight: '400' as const,
    fontFamily: 'Inter',
  },
  bodyMedium: {
    fontSize: 14, // text-sm
    lineHeight: 20,
    fontWeight: '400' as const,
    fontFamily: 'Inter',
  },
  bodySmall: {
    fontSize: 12, // text-xs
    lineHeight: 16,
    fontWeight: '400' as const,
    fontFamily: 'Inter',
  },
  labelLarge: {
    fontSize: 14, // text-sm
    lineHeight: 20,
    fontWeight: '500' as const,
    fontFamily: 'Inter',
  },
  labelMedium: {
    fontSize: 12, // text-xs
    lineHeight: 16,
    fontWeight: '500' as const,
    fontFamily: 'Inter',
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    fontFamily: 'Inter',
  },
};

// Breakpoints
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

// 1.3 Spacing System (8px Grid)
export const spacing = {
  none: 0,
  xs: 4,    // space-1
  sm: 8,    // space-2
  md: 12,   // space-3
  lg: 16,   // space-4
  xl: 20,   // space-5
  xxl: 24,  // space-6
  xxxl: 32, // space-8
  huge: 40, // space-10
  massive: 48, // space-12
  max: 64,  // space-16
};

// 1.5 Border Radius (Modern: More Rounded)
export const borderRadius = {
  none: 0,
  sm: 8,
  base: 16, // Modern "Card" look
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  '2xl': 48,
  '3xl': 60,
  full: 9999,
};

// 1.4 Elevation (Modern Colored Shadows)
export const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 15,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 25,
  },
  '3xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.3,
    shadowRadius: 60,
    elevation: 30,
  },
};

// 1.6 Animation Timings
export const animation = {
  fast: 100,
  base: 150,
  slow: 300,
  slower: 500,
  scale: 1.0,
};

// Gradient Presets
export const gradients = {
  primary: ['#7C3AED', '#A78BFA'] as const, // The requested vibrant purple gradient
  secondary: ['#10B981', '#059669'] as const, // Success
  onboarding: ['#F3E8FF', '#E9D5FF', '#FAE8FF'] as const, // Soft purple haze
  login: ['#4C1D95', '#6D28D9', '#8B5CF6'] as const, // Deep cosmic purple
  surface: ['#FFFFFF', '#FAFAFA'] as const,
  premium_bg: ['#2E1065', '#4C1D95', '#5B21B6'] as const, // Dark premium background
  glass_surface: ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.65)'] as const,
  glass_border: ['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.2)'] as const,
};

// Dark Theme Colors
const darkColors = {
  ...colors,
  primary: '#C084FC', // primary-400
  primaryLight: '#D8B4FE', // primary-300
  primaryDark: '#A855F7', // primary-500
  background: '#171717', // gray-900
  surface: '#262626', // gray-800
  surfaceVariant: '#404040', // gray-700
  outline: '#737373', // gray-500
  outlineVariant: '#525252', // gray-600
  onBackground: '#FAFAFA', // gray-50
  onSurface: '#FAFAFA', // gray-50
  onSurfaceVariant: '#D4D4D4', // gray-300
  textSecondary: '#D4D4D4', // gray-300
  textTertiary: '#A3A3A3', // gray-400
};

// Enhanced Theme
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...colors,
  },
  roundness: borderRadius.md,
  animation: {
    scale: 1.0,
  },
};

export const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    ...darkColors,
  },
  roundness: borderRadius.md,
  animation: {
    scale: 1.0,
  },
};

// Export all design tokens
export { colors, darkColors, typography };
