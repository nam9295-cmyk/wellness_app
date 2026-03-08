import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TeaRecommendationDetailModal } from '@/components/TeaRecommendationDetailModal';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { generateReportOverview } from '@/lib/reportUtils';
import { StatCard } from '@/components/StatCard';
import { InsightCard } from '@/components/InsightCard';
import { formatDisplayDate } from '@/lib/date';
import { getTeaRecommendationForRecentFlow } from '@/lib/teaRecommendationEngine';
import { normalizeLogsForReport } from '@/lib/reportLogUtils';

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

  const report = generateReportOverview(logs);
  const normalizedLogs = normalizeLogsForReport(logs);
  const teaRecommendation = getTeaRecommendationForRecentFlow({
    logs,
    userGoal: userSettings?.goal,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>웰니스 리포트</Text>
      <Text style={styles.caption}>이번 주 흐름과 전체 누적 기록을 나눠서 정리했어요.</Text>
      
      <Text style={styles.sectionCaption}>이번 주 흐름</Text>
      <InsightCard insights={report.weekly.insights} />

      <TouchableOpacity activeOpacity={0.88} onPress={() => setIsTeaDetailVisible(true)}>
        <View style={styles.teaCard}>
          <Text style={styles.teaCardLabel}>이번 주 추천 블렌드</Text>
          <View style={styles.teaCardRow}>
            <TeaThumbnail teaId={teaRecommendation.teaId} size="md" />
            <View style={styles.teaCardText}>
              <Text style={styles.teaName}>{teaRecommendation.content.name}</Text>
              <Text style={styles.teaIdentity}>{teaRecommendation.content.identityLine}</Text>
              <Text style={styles.teaSubtitle}>{teaRecommendation.content.subtitle}</Text>
              <Text style={styles.teaDescription}>{teaRecommendation.reason}</Text>
            </View>
          </View>
          <Text style={styles.teaContext}>{teaRecommendation.contextLine}</Text>
          <Text style={styles.teaUpdateHint}>최근 기록 기반 추천</Text>
          {teaRecommendation.secondaryContent ? (
            <Text style={styles.secondaryTea}>함께 추천: {teaRecommendation.secondaryContent.name}</Text>
          ) : null}
          <Text style={styles.detailHint}>추천 상세 보기</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          <StatCard label="이번 주 기록" value={report.weekly.logCount} suffix="일" />
          <StatCard label="전체 누적 기록" value={report.overall.logCount} suffix="일" />
        </View>
        <View style={styles.statRow}>
          <StatCard label="주간 평균 기분" value={report.weekly.avgMood} suffix="/ 5" />
          <StatCard label="주간 평균 피로" value={report.weekly.avgFatigue} suffix="/ 5" />
        </View>
        <View style={styles.statRow}>
          <StatCard label="이번 주 수면 흐름" value={report.weekly.frequentSleep} />
        </View>
      </View>

      <Text style={styles.sectionCaption}>전체 누적 흐름</Text>
      <InsightCard insights={report.overall.insights} />

      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          <StatCard label="전체 평균 기분" value={report.overall.avgMood} suffix="/ 5" />
          <StatCard label="전체 평균 피로" value={report.overall.avgFatigue} suffix="/ 5" />
        </View>
        <View style={styles.statRow}>
          <StatCard label="전체 수면 패턴" value={report.overall.frequentSleep} />
        </View>
      </View>

      <Text style={styles.subTitle}>최근 기록</Text>
      {normalizedLogs.length > 0 ? (
        normalizedLogs.slice(0, 5).map(log => (
          <View key={log.id} style={styles.historyRow}>
            <View>
              <Text style={styles.historyDate}>{formatDisplayDate(log.date)}</Text>
              <Text style={styles.historyMemo} numberOfLines={1}>
                {log.memo ? log.memo : '메모 없는 기록'}
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
        ))
      ) : (
        <Text style={styles.emptyText}>기록이 쌍이면 흐름이 더 또렷해져요.</Text>
      )}

      <TeaRecommendationDetailModal
        visible={isTeaDetailVisible}
        recommendation={teaRecommendation}
        reasonTitle="오늘의 추천 이유"
        onClose={() => setIsTeaDetailVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 26, fontWeight: '600', marginBottom: spacing.xl, color: colors.text, letterSpacing: -0.5 },
      caption: { fontSize: 14, color: colors.textLight, lineHeight: 22, marginTop: -spacing.md, marginBottom: spacing.lg, letterSpacing: -0.2 },
  sectionCaption: { fontSize: 14, color: colors.textLight, marginBottom: spacing.sm, fontWeight: '700', letterSpacing: -0.2 },
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
  teaCardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  teaCardText: { flex: 1 },
  teaName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4, letterSpacing: -0.4 },
  teaIdentity: { fontSize: 14, color: colors.text, marginBottom: 4, fontWeight: '600', letterSpacing: -0.2 },
  teaSubtitle: { fontSize: 13, color: colors.primary, marginBottom: spacing.sm, fontWeight: '600' },
  teaDescription: { fontSize: 15, color: colors.text, lineHeight: 24, letterSpacing: -0.2 },
  teaContext: { fontSize: 13, color: colors.textLight, marginTop: spacing.sm, letterSpacing: -0.2 },
  teaUpdateHint: { fontSize: 12, color: colors.primary, marginTop: spacing.sm, fontWeight: '700', letterSpacing: -0.1 },
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
  emptyText: { textAlign: 'center', color: colors.textLight, marginTop: spacing.md, fontSize: 15, lineHeight: 24 }
});
