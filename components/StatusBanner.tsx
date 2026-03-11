import { Pressable, StyleSheet, Text, View } from 'react-native';
import { atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';

type StatusBannerTone = 'default' | 'success' | 'muted';

interface StatusBannerProps {
  message: string;
  tone?: StatusBannerTone;
  ctaText?: string;
  onPress?: () => void;
}

const paletteByTone: Record<StatusBannerTone, { background: string; border: string; text: string }> = {
  default: {
    background: atelierColors.surface,
    border: atelierColors.border,
    text: atelierColors.textMuted,
  },
  success: {
    background: atelierColors.deepGreenMuted,
    border: atelierColors.deepGreenSoft,
    text: atelierColors.deepGreen,
  },
  muted: {
    background: atelierColors.surfaceMuted,
    border: atelierColors.borderStrong,
    text: atelierColors.textMuted,
  },
};

export function StatusBanner({
  message,
  tone = 'default',
  ctaText,
  onPress,
}: StatusBannerProps) {
  const palette = paletteByTone[tone];

  return (
    <View style={[styles.banner, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <Text style={[styles.message, { color: palette.text }]}>{message}</Text>
      {ctaText && onPress ? (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={[styles.cta, { color: palette.text }]}>{ctaText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    ...atelierCards.meta,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  message: {
    ...atelierText.bodyMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  cta: {
    marginTop: spacing.xs,
    textAlign: 'center',
    ...atelierText.helper,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
