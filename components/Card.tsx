import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '@/lib/theme';
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
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  title: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: spacing.md, 
    color: colors.text,
    letterSpacing: -0.3,
  }
});
