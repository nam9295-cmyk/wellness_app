import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { TeaRecommendationDetailModal } from '@/components/TeaRecommendationDetailModal';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { generateReportOverview, ReportPeriodStats } from '@/lib/reportUtils';
import { formatDisplayDate } from '@/lib/date';
import { getTeaRecommendationForRecentFlow } from '@/lib/teaRecommendationEngine';
import { normalizeLogsForReport } from '@/lib/reportLogUtils';

type ReportTabKey = 'daily' | 'weekly' | 'monthly';

const REPORT_TABS: Array<{ key: ReportTabKey; label: string; helper: string }> = [
  { key: 'daily', label: '하루', helper: '오늘 흐름' },
  { key: 'weekly', label: '일주일', helper: '최근 7일' },
  { key: 'monthly', label: '한달', helper: '최근 30일' },
];

function clampRhythmValue(value: string) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 3;
  }

  return Math.min(Math.max(numericValue, 1), 5);
}

function createCosineWavePoints(values: number[], xPositions: number[], baselineY: number, amplitudeScale: number) {
  const anchors = values.map((value, index) => {
    const normalized = (value - 3) / 2;

    return {
      x: xPositions[index],
      y: baselineY - normalized * amplitudeScale,
    };
  });

  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < anchors.length - 1; index += 1) {
    const start = anchors[index];
    const end = anchors[index + 1];
    const steps = 24;

    for (let step = 0; step <= steps; step += 1) {
      if (index > 0 && step === 0) {
        continue;
      }

      const t = step / steps;
      const eased = (1 - Math.cos(Math.PI * t)) / 2;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * eased,
      });
    }
  }

  return { anchors, points };
}

function pointsToPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return '';
  }

  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function pointsToAreaPath(points: Array<{ x: number; y: number }>, baselineY: number) {
  if (points.length === 0) {
    return '';
  }

  const first = points[0];
  const last = points[points.length - 1];
  return `${pointsToPath(points)} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

function BiorhythmChart({
  physicalValues,
  mentalValues,
}: {
  physicalValues: Array<{ key: ReportTabKey; value: string; shortLabel: string }>;
  mentalValues: Array<{ key: ReportTabKey; value: string; shortLabel: string }>;
}) {
  const width = 320;
  const height = 214;
  const baselineY = 92;
  const xPositions = [32, width / 2, width - 32];
  const physicalWave = createCosineWavePoints(
    physicalValues.map((entry) => clampRhythmValue(entry.value)),
    xPositions,
    baselineY,
    34,
  );
  const mentalWave = createCosineWavePoints(
    mentalValues.map((entry) => clampRhythmValue(entry.value)),
    xPositions,
    baselineY,
    28,
  );

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendDot, styles.chartLegendDotPhysical]} />
          <Text style={styles.chartLegendText}>신체 리듬</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendDot, styles.chartLegendDotMental]} />
          <Text style={styles.chartLegendText}>정신 리듬</Text>
        </View>
      </View>

      <View style={styles.chartBox}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Line
            x1={20}
            y1={baselineY}
            x2={width - 20}
            y2={baselineY}
            stroke={atelierColors.borderStrong}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path d={pointsToAreaPath(physicalWave.points, baselineY)} fill={atelierColors.deepGreen} opacity={0.08} />
          <Path d={pointsToAreaPath(mentalWave.points, baselineY)} fill={atelierColors.deepGreenSoft} opacity={0.1} />
          <Path
            d={pointsToPath(physicalWave.points)}
            fill="none"
            stroke={atelierColors.deepGreen}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={pointsToPath(mentalWave.points)}
            fill="none"
            stroke={atelierColors.deepGreenSoft}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {physicalWave.anchors.map((point, index) => (
            <Circle
              key={`physical-${physicalValues[index].key}`}
              cx={point.x}
              cy={point.y}
              r={7}
              fill={atelierColors.surface}
              stroke={atelierColors.deepGreen}
              strokeWidth={2.5}
            />
          ))}
          {mentalWave.anchors.map((point, index) => (
            <Circle
              key={`mental-${mentalValues[index].key}`}
              cx={point.x}
              cy={point.y}
              r={6}
              fill={atelierColors.surfaceMuted}
              stroke={atelierColors.deepGreenSoft}
              strokeWidth={2.5}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.chartLabelsRow}>
        {physicalValues.map((entry, index) => (
          <View key={entry.key} style={styles.chartLabelItem}>
            <Text style={styles.chartValuePrimary}>{physicalValues[index].value}</Text>
            <Text style={styles.chartValueSecondary}>{mentalValues[index].value}</Text>
            <Text style={styles.chartPointLabel}>{entry.shortLabel}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function buildImpactChips(stats: ReportPeriodStats) {
  return [
    `수면 ${stats.frequentSleep}`,
    `기분 ${stats.avgMood}/5`,
    `피로 ${stats.avgFatigue}/5`,
    `스트레스 ${stats.avgStress}/5`,
  ];
}

export default function ReportScreen() {
  const [isTeaDetailVisible, setIsTeaDetailVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportTabKey>('weekly');
  const { logs, isReady, userSettings } = useStore();

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

  const activeStats = useMemo(() => {
    if (activeTab === 'daily') {
      return report.daily;
    }

    if (activeTab === 'monthly') {
      return report.monthly;
    }

    return report.weekly;
  }, [activeTab, report.daily, report.monthly, report.weekly]);

  const activeTabMeta = REPORT_TABS.find((tab) => tab.key === activeTab) ?? REPORT_TABS[1];
  const impactChips = buildImpactChips(activeStats);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>WELLNESS DASHBOARD</Text>
      <Text style={styles.title}>웰니스 리포트</Text>
      <Text style={styles.caption}>하루, 일주일, 한달 흐름을 리듬처럼 읽을 수 있게 정리했어요.</Text>

      <View style={styles.biorhythmHero}>
        <View style={styles.biorhythmHeader}>
          <View style={styles.biorhythmHeaderText}>
            <Text style={styles.sectionCaption}>바이오리듬</Text>
            <Text style={styles.biorhythmTitle}>신체와 마음 흐름을 한눈에 살펴보세요.</Text>
          </View>
          <View style={styles.overallBadge}>
            <Text style={styles.overallBadgeText}>누적 {report.overall.logCount}일</Text>
          </View>
        </View>

        <BiorhythmChart
          physicalValues={[
            { key: 'daily', value: report.daily.physicalRhythm, shortLabel: '하루' },
            { key: 'weekly', value: report.weekly.physicalRhythm, shortLabel: '일주일' },
            { key: 'monthly', value: report.monthly.physicalRhythm, shortLabel: '한달' },
          ]}
          mentalValues={[
            { key: 'daily', value: report.daily.mentalRhythm, shortLabel: '하루' },
            { key: 'weekly', value: report.weekly.mentalRhythm, shortLabel: '일주일' },
            { key: 'monthly', value: report.monthly.mentalRhythm, shortLabel: '한달' },
          ]}
        />
      </View>

      <View style={styles.tabRow}>
        {REPORT_TABS.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.9}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              <Text style={[styles.tabHelper, isActive && styles.tabHelperActive]}>{tab.helper}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionCaption}>{activeTabMeta.label} 리듬</Text>
        <Text style={styles.summaryTitle}>{activeTabMeta.helper} 기준으로 본 현재 흐름</Text>

        <View style={styles.summaryMetricRow}>
          <View style={styles.summaryMetric}>
            <Text style={styles.summaryMetricLabel}>신체</Text>
            <Text style={styles.summaryMetricValue}>{activeStats.physicalRhythm}</Text>
          </View>
          <View style={styles.summaryMetric}>
            <Text style={styles.summaryMetricLabel}>정신</Text>
            <Text style={styles.summaryMetricValue}>{activeStats.mentalRhythm}</Text>
          </View>
          <View style={styles.summaryMetric}>
            <Text style={styles.summaryMetricLabel}>기록</Text>
            <Text style={styles.summaryMetricValue}>{activeStats.logCount}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.88} onPress={() => setIsTeaDetailVisible(true)}>
        <View style={styles.teaCard}>
          <Text style={styles.teaCardLabel}>추천 블렌드</Text>
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
          <Text style={styles.detailHint}>추천 상세 보기</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>주요 영향 요소</Text>
        <View style={styles.chipWrap}>
          {impactChips.map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>흐름 요약</Text>
        <View style={styles.insightStack}>
          {activeStats.insights.slice(0, 3).map((insight) => (
            <View key={insight} style={styles.insightRow}>
              <View style={styles.insightDot} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.subTitle}>최근 기록</Text>
      {normalizedLogs.length > 0 ? (
        normalizedLogs.slice(0, 5).map((log) => (
          <View key={log.id} style={styles.historyRow}>
            <View style={styles.historyTextWrap}>
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
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>기록이 쌓이면 흐름이 더 또렷해져요.</Text>
        </View>
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
  caption: {
    ...atelierText.summary,
    color: atelierColors.textMuted,
    fontSize: 14,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  biorhythmHero: {
    ...atelierCards.hero,
    padding: spacing.xl,
    borderRadius: 28,
    marginBottom: spacing.xl,
  },
  biorhythmHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  biorhythmHeaderText: {
    flex: 1,
  },
  sectionCaption: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.textSoft,
    marginBottom: spacing.xs,
  },
  biorhythmTitle: {
    ...atelierText.cardTitleLg,
    fontSize: 21,
    lineHeight: 28,
  },
  overallBadge: {
    ...atelierCards.meta,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  overallBadgeText: {
    ...atelierText.pill,
    color: atelierColors.deepGreen,
  },
  chartWrap: {
    width: '100%',
  },
  chartLegendRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  chartLegendDotPhysical: {
    backgroundColor: atelierColors.deepGreen,
  },
  chartLegendDotMental: {
    backgroundColor: atelierColors.deepGreenSoft,
  },
  chartLegendText: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
  },
  chartBox: {
    width: '100%',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  chartLabelsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  chartLabelItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  chartValuePrimary: {
    ...atelierText.cardTitleMd,
    fontSize: 19,
  },
  chartValueSecondary: {
    ...atelierText.helper,
    marginTop: 2,
    color: atelierColors.deepGreenSoft,
    fontSize: 12,
  },
  chartPointLabel: {
    ...atelierText.helper,
    marginTop: spacing.xs,
    color: atelierColors.textSoft,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tabButton: {
    ...atelierCards.meta,
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 18,
  },
  tabButtonActive: {
    backgroundColor: atelierColors.deepGreen,
    borderColor: atelierColors.deepGreen,
  },
  tabLabel: {
    ...atelierText.cardTitleMd,
    fontSize: 15,
    color: atelierColors.title,
  },
  tabLabelActive: {
    color: atelierColors.surface,
  },
  tabHelper: {
    ...atelierText.helper,
    marginTop: 4,
    color: atelierColors.textSoft,
  },
  tabHelperActive: {
    color: atelierColors.surface,
    opacity: 0.82,
  },
  summaryCard: {
    ...atelierCards.section,
    padding: spacing.xl,
    borderRadius: 24,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    ...atelierText.cardTitleMd,
    fontSize: 19,
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  summaryMetricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryMetric: {
    ...atelierCards.meta,
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 18,
  },
  summaryMetricLabel: {
    ...atelierText.helper,
    marginBottom: spacing.xs,
  },
  summaryMetricValue: {
    ...atelierText.cardTitleMd,
    fontSize: 18,
  },
  teaCard: {
    ...atelierCards.section,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: 26,
  },
  teaCardLabel: {
    ...atelierText.helper,
    fontSize: 13,
    color: atelierColors.textSoft,
    marginBottom: spacing.sm,
  },
  teaCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  teaCardText: {
    flex: 1,
    minWidth: 0,
  },
  teaName: {
    ...atelierText.cardTitleLg,
    fontSize: 22,
    marginBottom: 4,
  },
  teaIdentity: {
    ...atelierText.summary,
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '600',
  },
  teaSubtitle: {
    ...atelierText.helper,
    fontSize: 13,
    color: atelierColors.deepGreen,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  teaDescription: {
    ...atelierText.summary,
    fontSize: 15,
    lineHeight: 22,
  },
  teaContext: {
    ...atelierText.bodyMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  detailHint: {
    ...atelierText.helper,
    color: atelierColors.textMuted,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  supportCard: {
    ...atelierCards.section,
    padding: spacing.lg,
    borderRadius: 24,
    marginBottom: spacing.md,
  },
  supportTitle: {
    ...atelierText.cardTitleMd,
    marginBottom: spacing.md,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    ...atelierCards.meta,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipText: {
    ...atelierText.pill,
    color: atelierColors.text,
  },
  insightStack: {
    gap: spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreen,
    marginTop: 7,
  },
  insightText: {
    ...atelierText.body,
    flex: 1,
    lineHeight: 22,
  },
  subTitle: {
    ...atelierText.cardTitleMd,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  historyRow: {
    ...atelierCards.meta,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 22,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  historyTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  historyDate: {
    ...atelierText.helper,
    fontSize: 13,
    color: atelierColors.deepGreen,
    marginBottom: 4,
  },
  historyMemo: {
    ...atelierText.bodyMuted,
  },
  historyData: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexShrink: 0,
  },
  historyBadge: {
    ...atelierCards.meta,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyBadgeText: {
    ...atelierText.pill,
    color: atelierColors.text,
  },
  emptyCard: {
    ...atelierCards.meta,
    padding: spacing.lg,
    borderRadius: 22,
  },
  emptyText: {
    ...atelierText.bodyMuted,
  },
});
