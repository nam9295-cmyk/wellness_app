import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { generateReportStats } from '@/lib/reportUtils';
import { StatCard } from '@/components/StatCard';
import { InsightCard } from '@/components/InsightCard';

export default function ReportScreen() {
  const { logs, isReady } = useStore();

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const stats = generateReportStats(logs);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>내 웰니스 리포트</Text>
      
      <InsightCard insights={stats.insights} />
      
      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          <StatCard label="총 기록 일수" value={stats.totalLogs} suffix="일" />
          <StatCard label="최근 7일 기록" value={stats.recent7DaysLogs} suffix="일" />
        </View>
        <View style={styles.statRow}>
          <StatCard label="평균 기분" value={stats.avgMood} suffix="/ 5" />
          <StatCard label="평균 피로도" value={stats.avgFatigue} suffix="/ 5" />
        </View>
        <View style={styles.statRow}>
          <StatCard label="자주 겪은 수면" value={stats.frequentSleep} />
        </View>
      </View>

      <Text style={styles.subTitle}>최신 기록 타임라인</Text>
      {logs.slice(0, 5).map(log => (
        <View key={log.id} style={styles.historyRow}>
          <View>
            <Text style={styles.historyDate}>{log.date.replace(/-/g, '.')}</Text>
            <Text style={styles.historyMemo} numberOfLines={1}>
              {log.memo ? log.memo : '메모 없음'}
            </Text>
          </View>
          <View style={styles.historyData}>
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>기분 {log.mood}</Text>
            </View>
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>피로 {log.fatigue}</Text>
            </View>
          </View>
        </View>
      ))}

      {stats.totalLogs === 0 && (
        <Text style={styles.emptyText}>기록이 모이면 전체 리포트가 생성됩니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 26, fontWeight: '600', marginBottom: spacing.xl, color: colors.text, letterSpacing: -0.5 },
  subTitle: { fontSize: 18, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.md, color: colors.text, letterSpacing: -0.3 },
  statGrid: { gap: spacing.sm, marginBottom: spacing.xl },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  historyRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: colors.card, 
    padding: spacing.md, 
    borderRadius: 20, 
    marginBottom: spacing.sm, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  historyDate: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  historyMemo: { fontSize: 14, color: colors.textLight, maxWidth: 160, letterSpacing: -0.2 },
  historyData: { flexDirection: 'row', gap: spacing.xs },
  historyBadge: { 
    backgroundColor: colors.background, 
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8, 
    paddingVertical: 6, 
    borderRadius: 12, 
  },
  historyBadgeText: {
    color: colors.text, 
    fontSize: 12, 
    fontWeight: '500',
  },
  emptyText: { textAlign: 'center', color: colors.textLight, marginTop: spacing.xxl, fontSize: 15 }
});
