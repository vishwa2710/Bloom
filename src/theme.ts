/** Minimal design tokens. Kept deliberately small for the prototype. */

export const colors = {
  bg: '#F3F7F0',
  surface: '#FFFFFF',
  surfaceAlt: '#E8F0E2',
  primary: '#4C8C4A', // leaf green
  primaryDark: '#356B33',
  accent: '#E8A0BF', // blossom pink
  text: '#1F2A1D',
  textMuted: '#6B7A66',
  border: '#D8E2D2',
  wither: '#B07A4A', // dry / brown
  danger: '#C0492F',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
} as const;
