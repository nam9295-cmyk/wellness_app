import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

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
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 6,
    fontWeight: '500'
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary
  },
  suffix: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: 'normal'
  }
});
