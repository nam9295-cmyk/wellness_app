import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/lib/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
}

export function StatCard({ label, value, suffix }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {value} {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  suffix: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '400'
  }
});
