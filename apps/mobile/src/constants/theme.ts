import '@/global.css';

import { Platform } from 'react-native';

/**
 * Bold and playful: saturated fills with a darker "edge" underneath, so buttons
 * and path nodes read as something to press. Every `*Edge` colour is drawn as a
 * thick bottom border by the component that uses it.
 */
export const Colors = {
  light: {
    text: '#2C2C2A',
    background: '#ffffff',
    backgroundElement: '#F4F3EE',
    backgroundSelected: '#EAF3DE',
    textSecondary: '#6B6A64',
    border: '#E2E0D8',
    /** Bottom edge for neutral raised surfaces: cards, choices, secondary buttons. */
    elementEdge: '#D3D1C7',
    /** Primary action and progress colour. */
    brand: '#3A830E',
    brandEdge: '#285A08',
    brandText: '#ffffff',
    /** Correct answer. */
    success: '#3B6D11',
    successSurface: '#EAF3DE',
    /** Wrong answer. */
    danger: '#C93B3A',
    dangerEdge: '#8F2626',
    dangerSurface: '#FCEBEB',
    /** XP and level accents. */
    accent: '#BA7517',
    accentSurface: '#FAEEDA',
    accentEdge: '#EBB45A',
    streak: '#D85A30',
    xp: '#185FA5',
    locked: '#7A7870',
    lockedSurface: '#F1EFE8',
  },
  dark: {
    text: '#F4F3EE',
    background: '#141413',
    backgroundElement: '#232321',
    backgroundSelected: '#22331A',
    textSecondary: '#B4B2A9',
    border: '#3A3936',
    elementEdge: '#0B0B0A',
    brand: '#6CBF2A',
    brandEdge: '#3B6D11',
    brandText: '#132608',
    success: '#97C459',
    successSurface: '#1F2E14',
    danger: '#F07070',
    dangerEdge: '#8F2626',
    dangerSurface: '#3A1A19',
    accent: '#F5B342',
    accentSurface: '#3A2A10',
    accentEdge: '#7A5210',
    streak: '#F0997B',
    xp: '#85B7EB',
    locked: '#8A8983',
    lockedSurface: '#2A2A28',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
