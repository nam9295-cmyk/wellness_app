import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';
import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ title, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...atelierCards.section,
    padding: spacing.lg,
    borderRadius: 24,
    marginBottom: spacing.md,
  },
  title: { 
    ...atelierText.cardTitleMd,
    fontSize: 17,
    marginBottom: spacing.md, 
    color: atelierColors.title,
  }
});
