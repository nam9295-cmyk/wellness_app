import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '@/lib/theme';
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
      
      {/* AI 인사이트 카드 (조건부 렌더링) */}
      <InsightCard insights={stats.insights} />
      
      {/* 성과 지표 요약 박스 */}
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

      <Text style={styles.subTitle}>최신 기록 모아보기</Text>
      {logs.slice(0, 5).map(log => (
        <View key={log.id} style={styles.historyRow}>
          <View>
            <Text style={styles.historyDate}>{log.date}</Text>
            <Text style={styles.historyMemo} numberOfLines={1}>
              {log.memo ? `"${log.memo}"` : '메모 없음'}
            </Text>
          </View>
          <View style={styles.historyData}>
            <Text style={styles.historyBadge}>기분 {log.mood}</Text>
            <Text style={styles.historyBadge}>피로 {log.fatigue}</Text>
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
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: colors.text },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 12, color: colors.text },
  statGrid: { gap: 8, marginBottom: 24 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  historyRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F3F4F6' 
  },
  historyDate: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  historyMemo: { fontSize: 13, color: '#6B7280', maxWidth: 140 },
  historyData: { flexDirection: 'row', gap: 6 },
  historyBadge: { 
    backgroundColor: '#F0FDF4', 
    color: colors.primary, 
    fontSize: 12, 
    fontWeight: '600',
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    overflow: 'hidden' 
  },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 }
});
