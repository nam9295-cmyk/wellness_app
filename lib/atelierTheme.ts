import { spacing } from '@/lib/theme';

export const atelierColors = {
  background: '#F4EFE7',
  surface: '#FFFDF8',
  surfaceMuted: '#F7F1E8',
  title: '#231F1C',
  text: '#3D3631',
  textMuted: '#675F59',
  textSoft: '#91887F',
  border: '#E5DBCE',
  borderStrong: '#D7C9B9',
  deepGreen: '#4E6B61',
  deepGreenSoft: '#6F8A80',
  deepGreenMuted: '#E2E9E3',
  dustyRoseSoft: '#E6D9D4',
  cocoa: '#5C4337',
  cocoaStrong: '#3B2E27',
  cocoaSoft: '#7B5D4E',
  chipBg: '#F2EAE1',
  track: '#DCD1C3',
  chartGrid: '#DCD1C3',
  overlay: 'rgba(35, 31, 28, 0.26)',
} as const;

export const atelierCards = {
  hero: {
    backgroundColor: atelierColors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: atelierColors.borderStrong,
    shadowColor: atelierColors.cocoaStrong,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 22,
    elevation: 3,
  },
  section: {
    backgroundColor: atelierColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: atelierColors.border,
    shadowColor: atelierColors.cocoaStrong,
    shadowOpacity: 0.035,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 2,
  },
  meta: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
} as const;

export const atelierButtons = {
  primarySolid: {
    backgroundColor: atelierColors.deepGreen,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: atelierColors.deepGreen,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  secondaryMuted: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 18,
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
    fontSize: 32,
    fontWeight: '700' as const,
    color: atelierColors.title,
    letterSpacing: -0.9,
    lineHeight: 38,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: atelierColors.title,
    letterSpacing: -0.2,
  },
  cardTitleLg: {
    fontSize: 21,
    fontWeight: '700' as const,
    color: atelierColors.title,
    letterSpacing: -0.45,
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
    lineHeight: 25,
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
