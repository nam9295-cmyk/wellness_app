import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/lib/theme';

interface InsightCardProps {
  insights: string[];
}

export function InsightCard({ insights }: InsightCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>이번 주 인사이트</Text>
      <View style={styles.insightList}>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <View style={styles.bullet} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryLight + '15', 
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  header: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
    letterSpacing: -0.1,
  },
  insightList: {
    gap: spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 10,
    marginRight: 12,
  },
  insightText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    flex: 1,
    letterSpacing: -0.2,
  }
});
