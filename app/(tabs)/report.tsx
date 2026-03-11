import { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TeaRecommendationDetailModal } from '@/components/TeaRecommendationDetailModal';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { generateReportOverview } from '@/lib/reportUtils';
import { formatDisplayDate } from '@/lib/date';
import { getTeaRecommendationForRecentFlow } from '@/lib/teaRecommendationEngine';
import { normalizeLogsForReport } from '@/lib/reportLogUtils';

export default function ReportScreen() {
  const [isTeaDetailVisible, setIsTeaDetailVisible] = useState(false);
  const { logs, isReady, userSettings } = useStore();
  const moodProgress = useRef(new Animated.Value(0)).current;
  const fatigueProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(moodProgress, {
        toValue: 5,
        duration: 520,
        useNativeDriver: false,
      }),
      Animated.timing(fatigueProgress, {
        toValue: 5,
        duration: 520,
        useNativeDriver: false,
      }),
    ]).start();
  }, [moodProgress, fatigueProgress]);

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={atelierColors.deepGreen} />
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
      <Text style={styles.eyebrow}>WELLNESS DASHBOARD</Text>
      <Text style={styles.title}>웰니스 리포트</Text>
      <Text style={styles.caption}>이번 주 흐름과 전체 누적 기록을 한눈에 볼 수 있게 정리했어요.</Text>
      
      <Text style={styles.sectionCaption}>이번 주 흐름</Text>

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
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>이번 주 기록</Text>
            <Text style={styles.statValue}>{report.weekly.logCount}<Text style={styles.statSuffix}>일</Text></Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>전체 누적 기록</Text>
            <Text style={styles.statValue}>{report.overall.logCount}<Text style={styles.statSuffix}>일</Text></Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>주간 평균 기분</Text>
            <Text style={styles.statValue}>{report.weekly.avgMood}<Text style={styles.statSuffix}>/ 5</Text></Text>
            <View style={styles.miniScaleRow}>
              {[1, 2, 3, 4, 5].map((step) => (
                <Animated.View
                  key={`mood-${step}`}
                  style={[
                    styles.miniScaleDot,
                    Number(report.weekly.avgMood) >= step && styles.miniScaleDotActive,
                    {
                      opacity: moodProgress.interpolate({
                        inputRange: [step - 1, step],
                        outputRange: [0.28, 1],
                        extrapolate: 'clamp',
                      }),
                      transform: [
                        {
                          scaleX: moodProgress.interpolate({
                            inputRange: [step - 1, step],
                            outputRange: [0.55, 1],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>주간 평균 피로</Text>
            <Text style={styles.statValue}>{report.weekly.avgFatigue}<Text style={styles.statSuffix}>/ 5</Text></Text>
            <View style={styles.miniScaleRow}>
              {[1, 2, 3, 4, 5].map((step) => (
                <Animated.View
                  key={`fatigue-${step}`}
                  style={[
                    styles.miniScaleDot,
                    Number(report.weekly.avgFatigue) >= step && styles.miniScaleDotSoftActive,
                    {
                      opacity: fatigueProgress.interpolate({
                        inputRange: [step - 1, step],
                        outputRange: [0.28, 1],
                        extrapolate: 'clamp',
                      }),
                      transform: [
                        {
                          scaleX: fatigueProgress.interpolate({
                            inputRange: [step - 1, step],
                            outputRange: [0.55, 1],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sleepFlowCard}>
        <Text style={styles.flowLabel}>이번 주 수면 흐름</Text>
        <Text style={styles.flowValue}>{report.weekly.frequentSleep}</Text>
        <Text style={styles.flowText}>
          최근 기록에서 가장 자주 보인 수면 상태예요.
        </Text>
        <View style={styles.insightChipWrap}>
          {report.weekly.insights.slice(0, 3).map((insight) => (
            <View key={insight} style={styles.insightChip}>
              <Text style={styles.insightChipText}>{insight}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionCaption}>전체 누적 흐름</Text>

      <View style={styles.overallFlowCard}>
        <View style={styles.overallFlowHeader}>
          <View>
            <Text style={styles.flowLabel}>전체 누적 흐름</Text>
            <Text style={styles.overallPattern}>{report.overall.frequentSleep}</Text>
          </View>
          <View style={styles.patternPill}>
            <Text style={styles.patternPillText}>누적 패턴</Text>
          </View>
        </View>

        <View style={styles.miniMetricBlock}>
          <View style={styles.miniMetricRow}>
            <Text style={styles.miniMetricLabel}>기분</Text>
            <View style={styles.miniMetricTrack}>
              <View style={[styles.miniMetricFill, { width: `${(Number(report.overall.avgMood) / 5) * 100}%` }]} />
            </View>
            <Text style={styles.miniMetricValue}>{report.overall.avgMood}</Text>
          </View>
          <View style={styles.miniMetricRow}>
            <Text style={styles.miniMetricLabel}>피로</Text>
            <View style={styles.miniMetricTrack}>
              <View style={[styles.miniMetricFillSoft, { width: `${(Number(report.overall.avgFatigue) / 5) * 100}%` }]} />
            </View>
            <Text style={styles.miniMetricValue}>{report.overall.avgFatigue}</Text>
          </View>
        </View>

        <View style={styles.insightChipWrap}>
          {report.overall.insights.slice(0, 3).map((insight) => (
            <View key={insight} style={styles.insightChip}>
              <Text style={styles.insightChipText}>{insight}</Text>
            </View>
          ))}
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
  container: { flex: 1, backgroundColor: atelierColors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl + spacing.sm },
  eyebrow: { ...atelierText.helper, fontSize: 11, letterSpacing: 1.1, marginBottom: spacing.sm },
  title: { ...atelierText.heroTitle, fontSize: 28, lineHeight: 34, marginBottom: spacing.sm },
  caption: { ...atelierText.summary, color: atelierColors.textMuted, fontSize: 14, lineHeight: 24, marginBottom: spacing.xl + spacing.xs },
  sectionCaption: { ...atelierText.helper, fontSize: 13, marginBottom: spacing.md, color: atelierColors.textSoft },
  subTitle: { ...atelierText.cardTitleMd, marginTop: spacing.lg, marginBottom: spacing.md },
  teaCard: {
    ...atelierCards.hero,
    padding: spacing.xl,
    marginBottom: spacing.xl + spacing.xs,
    borderRadius: 26,
  },
  teaCardLabel: { ...atelierText.helper, fontSize: 13, color: atelierColors.textSoft, marginBottom: spacing.sm, letterSpacing: 0.2 },
  teaCardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  teaCardText: { flex: 1 },
  teaName: { ...atelierText.cardTitleLg, fontSize: 22, marginBottom: 4 },
  teaIdentity: { ...atelierText.summary, fontSize: 14, marginBottom: 4, fontWeight: '600' },
  teaSubtitle: { ...atelierText.helper, fontSize: 13, color: atelierColors.deepGreen, marginBottom: spacing.sm, fontWeight: '600' },
  teaDescription: { ...atelierText.summary, fontSize: 15 },
  teaContext: { ...atelierText.bodyMuted, fontSize: 13, marginTop: spacing.sm },
  teaUpdateHint: { ...atelierText.helper, color: atelierColors.deepGreen, marginTop: spacing.sm, letterSpacing: -0.1 },
  secondaryTea: { ...atelierText.body, fontSize: 13, marginTop: spacing.sm, fontWeight: '600', letterSpacing: -0.1 },
  detailHint: { ...atelierText.helper, color: atelierColors.textMuted, marginTop: spacing.md, fontWeight: '600', letterSpacing: -0.1 },
  statGrid: { gap: spacing.md, marginBottom: spacing.xl + spacing.xs },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  statCard: {
    ...atelierCards.section,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 22,
  },
  statLabel: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.textSoft,
    marginBottom: spacing.sm,
  },
  statValue: {
    ...atelierText.heroTitle,
    fontSize: 26,
    lineHeight: 30,
    color: atelierColors.title,
  },
  statSuffix: {
    ...atelierText.bodyMuted,
    fontSize: 14,
    color: atelierColors.textSoft,
  },
  miniScaleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  miniScaleDot: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: atelierColors.border,
  },
  miniScaleDotActive: {
    backgroundColor: atelierColors.deepGreen,
  },
  miniScaleDotSoftActive: {
    backgroundColor: atelierColors.deepGreenSoft,
  },
  sleepFlowCard: {
    ...atelierCards.section,
    padding: spacing.xl,
    marginBottom: spacing.xl + spacing.xs,
    borderRadius: 24,
  },
  flowLabel: {
    ...atelierText.helper,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  flowValue: {
    ...atelierText.cardTitleLg,
    marginBottom: spacing.sm,
  },
  flowText: {
    ...atelierText.bodyMuted,
    marginBottom: spacing.md,
  },
  insightChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  insightChip: {
    ...atelierCards.meta,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  insightChipText: {
    ...atelierText.helper,
    color: atelierColors.text,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  overallFlowCard: {
    ...atelierCards.hero,
    padding: spacing.xl,
    marginBottom: spacing.xl + spacing.xs,
    borderRadius: 26,
  },
  overallFlowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  overallPattern: {
    ...atelierText.cardTitleMd,
    marginTop: spacing.xs,
  },
  patternPill: {
    ...atelierCards.meta,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreenMuted,
    borderColor: atelierColors.deepGreenSoft,
  },
  patternPillText: {
    ...atelierText.pill,
  },
  miniMetricBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  miniMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniMetricLabel: {
    ...atelierText.helper,
    width: 34,
    color: atelierColors.textSoft,
  },
  miniMetricTrack: {
    flex: 1,
    height: 8,
    backgroundColor: atelierColors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  miniMetricFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreen,
  },
  miniMetricFillSoft: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreenSoft,
  },
  miniMetricValue: {
    ...atelierText.helper,
    width: 28,
    textAlign: 'right',
    color: atelierColors.title,
  },
  historyRow: {
    ...atelierCards.section,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 22,
    marginBottom: spacing.md,
  },
  historyDate: { ...atelierText.helper, fontSize: 13, color: atelierColors.deepGreen, marginBottom: 4, fontWeight: '600' },
  historyMemo: { ...atelierText.bodyMuted, maxWidth: 160 },
  historyData: { flexDirection: 'row', gap: spacing.xs },
  historyBadge: { 
    backgroundColor: atelierColors.surfaceMuted, 
    borderWidth: 1,
    borderColor: atelierColors.border,
    paddingHorizontal: 8, 
    paddingVertical: 6, 
    borderRadius: 12, 
  },
  historyBadgeText: {
    color: atelierColors.text, 
    fontSize: 12, 
    fontWeight: '500',
  },
  emptyText: { ...atelierText.bodyMuted, textAlign: 'center', marginTop: spacing.md, fontSize: 15, lineHeight: 24 }
});
