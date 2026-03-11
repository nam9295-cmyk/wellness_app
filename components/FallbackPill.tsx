import { StyleSheet, Text, View } from 'react-native';
import { atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';

interface FallbackPillProps {
  label: string;
  inline?: boolean;
}

export function FallbackPill({ label, inline = false }: FallbackPillProps) {
  return (
    <View style={[styles.pill, inline && styles.pillInline]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    ...atelierCards.meta,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: atelierColors.surfaceMuted,
  },
  pillInline: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  label: {
    ...atelierText.pill,
    color: atelierColors.textSoft,
  },
});
