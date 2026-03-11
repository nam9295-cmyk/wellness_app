import { Pressable, StyleSheet, Text, View } from 'react-native';
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
    fontSize: 22,
    color: '#2F2824',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: '#6F6560',
    lineHeight: 22,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyCtaText: {
    fontSize: 13,
    color: '#6E8E82',
    fontWeight: '600',
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 20,
  },
});
