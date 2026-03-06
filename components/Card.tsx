import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/lib/theme';
import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ title, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    color: colors.text 
  }
});
