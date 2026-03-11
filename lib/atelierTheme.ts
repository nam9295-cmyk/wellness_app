import { spacing } from '@/lib/theme';

export const atelierColors = {
  background: '#F5F1EA',
  surface: '#FFFDF9',
  surfaceMuted: '#F8F3ED',
  title: '#2F2824',
  text: '#473D37',
  textMuted: '#6F6560',
  textSoft: '#8B817A',
  border: '#E3D8CD',
  borderStrong: '#D4C5B8',
  deepGreen: '#6E8E82',
  deepGreenSoft: '#8FA89D',
  deepGreenMuted: '#E1EAE5',
  dustyRoseSoft: '#E6D9D4',
  cocoa: '#5A4034',
  cocoaStrong: '#432D23',
  cocoaSoft: '#7A5A4A',
  chipBg: '#F3ECE5',
  track: '#DDD2C7',
  chartGrid: '#DDD2C7',
} as const;

export const atelierCards = {
  hero: {
    backgroundColor: atelierColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: atelierColors.borderStrong,
    shadowColor: atelierColors.cocoaStrong,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
    elevation: 2,
  },
  section: {
    backgroundColor: atelierColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: atelierColors.border,
    shadowColor: atelierColors.cocoaStrong,
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 1,
  },
  meta: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
} as const;

export const atelierButtons = {
  primarySolid: {
    backgroundColor: atelierColors.deepGreen,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: atelierColors.deepGreen,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 3,
  },
  secondaryMuted: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: atelierColors.borderStrong,
  },
  inlineText: {
    fontSize: 14,
    color: atelierColors.textMuted,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
} as const;

export const atelierText = {
  heroTitle: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: atelierColors.title,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: atelierColors.title,
    letterSpacing: -0.2,
  },
  cardTitleLg: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: atelierColors.title,
    letterSpacing: -0.4,
  },
  cardTitleMd: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: atelierColors.title,
    letterSpacing: -0.3,
  },
  summary: {
    fontSize: 16,
    color: atelierColors.text,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    color: atelierColors.text,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  bodyMuted: {
    fontSize: 14,
    color: atelierColors.textMuted,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  helper: {
    fontSize: 12,
    color: atelierColors.textSoft,
    fontWeight: '700' as const,
    letterSpacing: 0.1,
  },
  pill: {
    fontSize: 11,
    color: atelierColors.deepGreen,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
} as const;

export const atelierSpacing = {
  sectionGap: spacing.lg,
  cardPadding: spacing.lg,
  compactPadding: spacing.md,
} as const;
