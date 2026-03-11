import { Pressable, StyleSheet, Text, View } from 'react-native';
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
    background: '#FFFDF9',
    border: '#E3D8CD',
    text: '#6F6560',
  },
  success: {
    background: '#E1EAE5',
    border: '#8FA89D',
    text: '#6E8E82',
  },
  muted: {
    background: '#F8F3ED',
    border: '#D4C5B8',
    text: '#6F6560',
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
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  cta: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
