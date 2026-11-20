import { StyleSheet } from 'react-native';

export type Scheme = 'light' | 'dark';

const shared = {
  primary: '#0369A1',
  primaryBright: '#0EA5E9',
  accent: '#F97316',
  good: '#15803D',
  warn: '#B45309',
  bad: '#B91C1C',
  grad: ['#0369A1', '#0EA5E9'] as const,
  /** Text and icons on brand-colored backgrounds. */
  onColor: '#FFFFFF',
};

const light = {
  ...shared,
  primarySoft: '#E0F2FE',
  /** Header bars and hero (always dark enough for white text). */
  brand: '#0369A1',
  /** Text on a primary-colored fill. */
  onPrimary: '#FFFFFF',
  accentSoft: '#FFEDD5',
  goodSoft: '#DCFCE7',
  warnSoft: '#FEF3C7',
  bg: '#F1F5F9',
  card: '#FFFFFF',
  surface: '#F1F5F9',
  text: '#0F172A',
  muted: '#64748B',
  faint: '#7C8798',
  line: '#E2E8F0',
  overlay: 'rgba(15,23,42,0.5)',
  link: '#0369A1',
};

export type Palette = typeof light;

const dark: Palette = {
  ...shared,
  primary: '#38BDF8',
  primarySoft: '#0C2A3D',
  brand: '#0C4A6E',
  onPrimary: '#06121F',
  accentSoft: '#3A2210',
  goodSoft: '#0F2A1A',
  warnSoft: '#33260C',
  good: '#4ADE80',
  warn: '#FBBF24',
  bad: '#F87171',
  bg: '#0B1220',
  card: '#131C2E',
  surface: '#1C2740',
  text: '#E2E8F0',
  muted: '#94A3B8',
  faint: '#7C8BA1',
  line: '#22304A',
  overlay: 'rgba(0,0,0,0.65)',
  link: '#7DD3FC',
};

const PALETTES: Record<Scheme, Palette> = { light, dark };
let current: Scheme = 'light';

/** Switch palettes. The root layout keys the tree on the scheme so every screen re-renders. */
export function setScheme(s: Scheme) {
  current = s;
}

export function getScheme(): Scheme {
  return current;
}

/** The active palette. */
export const C: Palette = new Proxy(light, {
  get: (_, key) => PALETTES[current][key as keyof Palette],
}) as Palette;

/**
 * StyleSheet built per scheme: styles read colors from C when first used in a
 * scheme, and are cached for that scheme.
 */
export function themed<T extends StyleSheet.NamedStyles<T>>(build: () => T): T {
  const cache: Partial<Record<Scheme, T>> = {};
  return new Proxy({} as T, {
    get: (_, key) => (cache[current] ??= StyleSheet.create(build()))[key as keyof T],
  });
}

export const MAX_WIDTH = 960;
export const RADIUS = 14;
