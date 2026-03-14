import { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Animated } from 'react-native';
import Svg, { Circle, Line, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { TeaRecommendationDetailModal } from '@/components/TeaRecommendationDetailModal';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { atelierColors, atelierText } from '@/lib/atelierTheme';
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
      if (index > 0 && step === 0) continue;
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
  if (points.length === 0) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function pointsToAreaPath(points: Array<{ x: number; y: number }>, baselineY: number) {
  if (points.length === 0) return '';
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
  const screenWidth = Dimensions.get('window').width;
  const width = screenWidth - spacing.xl * 2 - spacing.xl * 2;
  const height = 180;
  const baselineY = height / 2;
  const xPositions = [20, width / 2, width - 20];
  
  const physicalWave = createCosineWavePoints(
    physicalValues.map((entry) => clampRhythmValue(entry.value)),
    xPositions,
    baselineY,
    50,
  );
  const mentalWave = createCosineWavePoints(
    mentalValues.map((entry) => clampRhythmValue(entry.value)),
    xPositions,
    baselineY,
    40,
  );

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendDot, styles.chartLegendDotPhysical]} />
          <Text style={styles.chartLegendText}>신체</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendDot, styles.chartLegendDotMental]} />
          <Text style={styles.chartLegendText}>정신</Text>
        </View>
      </View>

      <View style={styles.chartBox}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="physicalGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={atelierColors.deepGreen} stopOpacity="0.2" />
              <Stop offset="1" stopColor={atelierColors.deepGreen} stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="mentalGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={atelierColors.deepGreenSoft} stopOpacity="0.25" />
              <Stop offset="1" stopColor={atelierColors.deepGreenSoft} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          <Line
            x1={0}
            y1={baselineY}
            x2={width}
            y2={baselineY}
            stroke={atelierColors.borderStrong}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <Path d={pointsToAreaPath(physicalWave.points, baselineY)} fill="url(#physicalGradient)" />
          <Path d={pointsToAreaPath(mentalWave.points, baselineY)} fill="url(#mentalGradient)" />
          <Path
            d={pointsToPath(physicalWave.points)}
            fill="none"
            stroke={atelierColors.deepGreen}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={pointsToPath(mentalWave.points)}
            fill="none"
            stroke={atelierColors.deepGreenSoft}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {physicalWave.anchors.map((point, index) => (
            <Circle
              key={`physical-${physicalValues[index].key}`}
              cx={point.x}
              cy={point.y}
              r={6}
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
              r={5}
              fill={atelierColors.surfaceMuted}
              stroke={atelierColors.deepGreenSoft}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.chartLabelsRow}>
        {physicalValues.map((entry, index) => (
          <View key={entry.key} style={styles.chartLabelItem}>
            <Text style={styles.chartValuePrimary}>{physicalValues[index].value}</Text>
            <Text style={styles.chartPointLabel}>{entry.shortLabel}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportBarChart({ label, value }: { label: string, value: string }) {
  const numValue = Number(value) || 0;
  const percentage = Math.min(Math.max((numValue / 5) * 100, 0), 100);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: percentage,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percentage, animValue]);
  
  return (
    <View style={styles.barItem}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{numValue.toFixed(1)}<Text style={styles.barValueMax}>/5</Text></Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { 
          width: animValue.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%']
          }) 
        }]} />
      </View>
    </View>
  );
}

export default function ReportScreen() {
  const [isTeaDetailVisible, setIsTeaDetailVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportTabKey>('weekly');
  const { logs = [], isReady, userSettings } = useStore();

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

  const activeStats = 
    activeTab === 'daily' ? report.daily :
    activeTab === 'monthly' ? report.monthly :
    report.weekly;

  const activeTabMeta = REPORT_TABS.find((tab) => tab.key === activeTab) ?? REPORT_TABS[1];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>WELLNESS DASHBOARD</Text>
      <Text style={styles.title}>웰니스 리포트</Text>
      <Text style={styles.caption}>하루, 일주일, 한달 흐름을{'\n'}리듬처럼 읽을 수 있게 정리했어요.</Text>

      <View style={styles.biorhythmHero}>
        <View style={styles.biorhythmHeader}>
          <View style={styles.biorhythmHeaderText}>
            <Text style={styles.sectionCaption}>바이오리듬</Text>
            <Text style={styles.biorhythmTitle}>신체와 마음 흐름</Text>
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
        <Text style={styles.sectionCaption}>{activeTabMeta.label} 리듬 요약</Text>
        <Text style={styles.summaryTitle}>{activeTabMeta.helper} 흐름 분석</Text>

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

      <TouchableOpacity activeOpacity={0.88} onPress={() => setIsTeaDetailVisible(true)} style={styles.teaCard}>
        <Text style={styles.teaCardLabel}>FLOW RECOMMENDATION</Text>
        <View style={styles.teaCardRow}>
          <TeaThumbnail teaId={teaRecommendation.teaId} size="md" />
          <View style={styles.teaCardText}>
            <Text style={styles.teaName}>{teaRecommendation.content.name}</Text>
            <Text style={styles.teaIdentity}>{teaRecommendation.content.identityLine}</Text>
            <Text style={styles.teaDescription}>{teaRecommendation.reason}</Text>
          </View>
        </View>
        <View style={styles.signatureFooter}>
          <Text style={styles.detailHint}>추천 상세 보기</Text>
          <Text style={styles.signatureFooterArrow}>→</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>상세 지표 분석</Text>
        <View style={styles.barChartWrap}>
          <ReportBarChart label="평균 수면" value={activeStats.avgSleep} />
          <ReportBarChart label="평균 기분" value={activeStats.avgMood} />
          <ReportBarChart label="평균 피로도" value={activeStats.avgFatigue} />
          <ReportBarChart label="평균 스트레스" value={activeStats.avgStress} />
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
  content: { padding: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxl + spacing.xl },
  eyebrow: { ...atelierText.helper, color: atelierColors.deepGreen, letterSpacing: 2, marginBottom: spacing.sm },
  title: { ...atelierText.heroTitle, fontSize: 32, lineHeight: 42, marginBottom: spacing.sm, fontWeight: '300', letterSpacing: -1 },
  caption: { ...atelierText.bodyMuted, fontSize: 16, lineHeight: 26, color: atelierColors.textMuted, marginBottom: spacing.xxl },
  
  biorhythmHero: {
    backgroundColor: atelierColors.surface,
    padding: spacing.xl,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: atelierColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 1,
    marginBottom: spacing.xxl,
  },
  biorhythmHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  biorhythmHeaderText: { flex: 1 },
  sectionCaption: { ...atelierText.helper, fontSize: 12, color: atelierColors.textSoft, marginBottom: 4 },
  biorhythmTitle: { ...atelierText.cardTitleLg, fontSize: 21, lineHeight: 28 },
  overallBadge: { backgroundColor: atelierColors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: atelierColors.border },
  overallBadgeText: { ...atelierText.pill, color: atelierColors.deepGreen },
  
  chartWrap: { width: '100%' },
  chartLegendRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartLegendDot: { width: 8, height: 8, borderRadius: 4 },
  chartLegendDotPhysical: { backgroundColor: atelierColors.deepGreen },
  chartLegendDotMental: { backgroundColor: atelierColors.deepGreenSoft },
  chartLegendText: { ...atelierText.helper, color: atelierColors.textSoft, fontSize: 11 },
  chartBox: { width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  chartLabelsRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  chartLabelItem: { alignItems: 'center' },
  chartValuePrimary: { ...atelierText.cardTitleMd, fontSize: 18, color: atelierColors.title },
  chartPointLabel: { ...atelierText.helper, marginTop: 4, color: atelierColors.textSoft, fontSize: 11 },
  
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 16, backgroundColor: atelierColors.surface, borderWidth: 1, borderColor: atelierColors.border },
  tabButtonActive: { backgroundColor: atelierColors.deepGreen, borderColor: atelierColors.deepGreen },
  tabLabel: { ...atelierText.cardTitleMd, fontSize: 14, color: atelierColors.title },
  tabLabelActive: { color: atelierColors.surface },
  tabHelper: { ...atelierText.helper, marginTop: 2, color: atelierColors.textSoft, fontSize: 10 },
  tabHelperActive: { color: atelierColors.surface, opacity: 0.8 },
  
  summaryCard: { backgroundColor: atelierColors.surface, padding: spacing.xl, borderRadius: 24, marginBottom: spacing.lg, borderWidth: 1, borderColor: atelierColors.border },
  summaryTitle: { ...atelierText.cardTitleMd, fontSize: 19, lineHeight: 26, marginBottom: spacing.md },
  summaryMetricRow: { flexDirection: 'row', gap: spacing.sm },
  summaryMetric: { backgroundColor: atelierColors.surfaceMuted, borderWidth: 1, borderColor: atelierColors.border, flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: 18 },
  summaryMetricLabel: { ...atelierText.helper, color: atelierColors.textSoft, marginBottom: 4 },
  summaryMetricValue: { ...atelierText.cardTitleMd, fontSize: 18 },
  
  teaCard: { backgroundColor: atelierColors.surface, padding: spacing.xl, marginBottom: spacing.lg, borderRadius: 26, borderWidth: 1, borderColor: atelierColors.border },
  teaCardLabel: { ...atelierText.helper, fontSize: 11, color: atelierColors.deepGreen, letterSpacing: 1, marginBottom: spacing.lg },
  teaCardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  teaCardText: { flex: 1 },
  teaName: { ...atelierText.cardTitleLg, fontSize: 22, marginBottom: 4 },
  teaIdentity: { ...atelierText.summary, fontSize: 14, marginBottom: 8, fontWeight: '600', color: atelierColors.deepGreen },
  teaDescription: { ...atelierText.summary, fontSize: 15, lineHeight: 22, color: atelierColors.text },
  signatureFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: atelierColors.border },
  signatureFooterArrow: { fontSize: 18, color: atelierColors.deepGreen },
  
  supportCard: { backgroundColor: atelierColors.surface, padding: spacing.xl, borderRadius: 24, marginBottom: spacing.lg, borderWidth: 1, borderColor: atelierColors.border },
  supportTitle: { ...atelierText.cardTitleMd, fontSize: 18, marginBottom: spacing.lg },
  barChartWrap: { gap: spacing.lg },
  barItem: { width: '100%' },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm },
  barLabel: { ...atelierText.body, fontSize: 14, color: atelierColors.textMuted },
  barValue: { ...atelierText.cardTitleMd, fontSize: 18, color: atelierColors.title },
  barValueMax: { fontSize: 13, color: atelierColors.textSoft, fontWeight: '400' },
  barTrack: { height: 8, backgroundColor: atelierColors.surfaceMuted, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: atelierColors.border },
  barFill: { height: '100%', backgroundColor: atelierColors.deepGreen, borderRadius: 4 },
  
  insightStack: { gap: spacing.md },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: atelierColors.deepGreenSoft, marginTop: 8 },
  insightText: { ...atelierText.body, flex: 1, lineHeight: 22, color: atelierColors.text },
  
  subTitle: { ...atelierText.cardTitleMd, marginTop: spacing.xl, marginBottom: spacing.md, color: atelierColors.title },
  historyRow: { backgroundColor: atelierColors.surface, borderWidth: 1, borderColor: atelierColors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderRadius: 24, marginBottom: spacing.md, gap: spacing.md },
  historyTextWrap: { flex: 1 },
  historyDate: { ...atelierText.helper, fontSize: 13, color: atelierColors.deepGreen, marginBottom: 4, letterSpacing: 0.5 },
  historyMemo: { ...atelierText.bodyMuted, lineHeight: 22 },
  historyData: { flexDirection: 'row', gap: 8 },
  historyBadge: { backgroundColor: atelierColors.surfaceMuted, borderWidth: 1, borderColor: atelierColors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  historyBadgeText: { ...atelierText.pill, color: atelierColors.textMuted, fontSize: 11 },
  emptyCard: { backgroundColor: atelierColors.surfaceMuted, borderWidth: 1, borderColor: atelierColors.border, padding: spacing.xl, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...atelierText.bodyMuted, textAlign: 'center' },
  detailHint: { ...atelierText.helper, color: atelierColors.textMuted, fontWeight: '600' },
});
