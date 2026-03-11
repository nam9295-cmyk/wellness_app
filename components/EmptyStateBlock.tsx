import { Pressable, StyleSheet, Text, View } from 'react-native';
import { atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';

interface EmptyStateBlockProps {
  title?: string;
  text: string;
  ctaText?: string;
  onPress?: () => void;
  centered?: boolean;
}

export function EmptyStateBlock({
  title,
  text,
  ctaText,
  onPress,
  centered = false,
}: EmptyStateBlockProps) {
  return (
    <View style={[styles.emptyStateWrap, centered && styles.emptyStateCentered]}>
      {title ? <Text style={styles.emptyTitle}>{title}</Text> : null}
      <Text style={styles.emptyText}>{text}</Text>
      {ctaText ? (
        onPress ? (
          <Pressable onPress={onPress} hitSlop={8}>
            <Text style={styles.emptyCtaText}>{ctaText}</Text>
          </Pressable>
        ) : (
          <Text style={styles.emptyCtaText}>{ctaText}</Text>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyStateWrap: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  emptyStateCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...atelierText.cardTitleLg,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...atelierText.bodyMuted,
    textAlign: 'center',
  },
  emptyCtaText: {
    ...atelierText.helper,
    color: atelierText.pill.color,
    fontWeight: '600',
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 20,
  },
});
