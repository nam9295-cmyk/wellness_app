import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

interface InsightCardProps {
  insights: string[];
}

export function InsightCard({ insights }: InsightCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>✨ AI 웰니스 분석</Text>
      <View style={styles.insightList}>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FDFBF7', // 약간 따뜻하고 부드러운 배경색
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3EFE6',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D97706', // 앰버 컬러 톤 매칭
    marginBottom: 12,
  },
  insightList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: colors.primaryLight,
    marginRight: 8,
    lineHeight: 22,
  },
  insightText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    flex: 1,
  }
});
