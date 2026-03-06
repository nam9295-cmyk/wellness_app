import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TeaRecommendationDetailModal } from '@/components/TeaRecommendationDetailModal';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { generateReportStats } from '@/lib/reportUtils';
import { StatCard } from '@/components/StatCard';
import { InsightCard } from '@/components/InsightCard';
import { formatDisplayDate } from '@/lib/date';
import { getTeaRecommendationForRecentFlow } from '@/lib/teaRecommendationEngine';

export default function ReportScreen() {
  const [isTeaDetailVisible, setIsTeaDetailVisible] = useState(false);
  const { logs, isReady, userSettings } = useStore();

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const stats = generateReportStats(logs);
  const teaRecommendation = getTeaRecommendationForRecentFlow({
    logs,
    userGoal: userSettings?.goal,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>내 웰니스 리포트</Text>
      
      <InsightCard insights={stats.insights} />

      <TouchableOpacity activeOpacity={0.88} onPress={() => setIsTeaDetailVisible(true)}>
        <View style={styles.teaCard}>
          <Text style={styles.teaCardLabel}>이번 주 추천 티</Text>
          <Text style={styles.teaName}>{teaRecommendation.content.name}</Text>
          <Text style={styles.teaSubtitle}>{teaRecommendation.content.subtitle}</Text>
          <Text style={styles.teaDescription}>{teaRecommendation.reason}</Text>
          <Text style={styles.teaContext}>{teaRecommendation.contextLine}</Text>
          {teaRecommendation.secondaryContent ? (
            <Text style={styles.secondaryTea}>보조 후보: {teaRecommendation.secondaryContent.name}</Text>
          ) : null}
          <Text style={styles.detailHint}>눌러서 최근 흐름 기준 추천 이유 보기</Text>
        </View>
      </TouchableOpacity>
      
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
            <Text style={styles.historyDate}>{formatDisplayDate(log.date)}</Text>
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

      <TeaRecommendationDetailModal
        visible={isTeaDetailVisible}
        recommendation={teaRecommendation}
        reasonTitle="최근 흐름에 잘 맞는 이유"
        onClose={() => setIsTeaDetailVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 26, fontWeight: '600', marginBottom: spacing.xl, color: colors.text, letterSpacing: -0.5 },
  subTitle: { fontSize: 18, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.md, color: colors.text, letterSpacing: -0.3 },
  teaCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  teaCardLabel: { fontSize: 13, fontWeight: '700', color: colors.textLight, marginBottom: spacing.sm, letterSpacing: 0.2 },
  teaName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4, letterSpacing: -0.4 },
  teaSubtitle: { fontSize: 13, color: colors.primary, marginBottom: spacing.sm, fontWeight: '600' },
  teaDescription: { fontSize: 15, color: colors.text, lineHeight: 24, letterSpacing: -0.2 },
  teaContext: { fontSize: 13, color: colors.textLight, marginTop: spacing.sm, letterSpacing: -0.2 },
  secondaryTea: { fontSize: 13, color: colors.text, marginTop: spacing.sm, fontWeight: '600', letterSpacing: -0.1 },
  detailHint: { fontSize: 12, color: colors.textLight, marginTop: spacing.md, fontWeight: '600', letterSpacing: -0.1 },
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
