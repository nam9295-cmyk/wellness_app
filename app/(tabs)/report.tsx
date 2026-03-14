import { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Animated } from 'react-native';
import Svg, { Circle, Line, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { generateReportOverview, ReportPeriodStats } from '@/lib/reportUtils';
import { formatDisplayDate } from '@/lib/date';
import { normalizeLogsForReport } from '@/lib/reportLogUtils';
import { calculateMentalRhythmScore, calculatePhysicalRhythmScore } from '@/lib/wellnessScoring';

type ReportTabKey = 'daily' | 'weekly' | 'monthly';

const REPORT_TABS: Array<{ key: ReportTabKey; label: string; helper: string }> = [
  { key: 'daily', label: '1D', helper: '오늘 하루' },
  { key: 'weekly', label: '1W', helper: '최근 7일' },
  { key: 'monthly', label: '1M', helper: '최근 30일' },
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

function ReportEnergyBar({ label, value }: { label: string, value: string }) {
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
    <View style={styles.energyBarRow}>
      <View style={styles.energyBarHeader}>
        <Text style={styles.energyBarLabel}>{label}</Text>
        <Text style={styles.energyBarValue}>{numValue.toFixed(1)}</Text>
      </View>
      <View style={styles.energyBarContainer}>
        <View style={styles.energyBarTrack}>
          <Animated.View style={[styles.energyBarFillWrap, { 
            width: animValue.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            }) 
          }]}>
            <View style={styles.energyBarGradient}>
              {/* Fake segments using borders */}
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={[styles.energyBarDivider, { left: `${i * 20}%` }]} />
              ))}
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function BiorhythmChart({
  physicalValues,
  mentalValues,
}: {
  physicalValues: Array<{ key: string; value: string; shortLabel: string }>;
  mentalValues: Array<{ key: string; value: string; shortLabel: string }>;
}) {
  const screenWidth = Dimensions.get('window').width;
  const width = screenWidth - spacing.xl * 2 - spacing.xl * 2;
  const height = 180;
  const baselineY = height / 2;
  
  const count = Math.max(physicalValues.length, 1);
  const paddingX = count === 1 ? width / 2 : 20;
  const xPositions = physicalValues.map((_, i) => 
    count === 1 ? paddingX : paddingX + (i / (count - 1)) * (width - paddingX * 2)
  );
  
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
          {physicalWave.points.length > 1 && (
            <>
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
            </>
          )}
          {physicalWave.anchors.map((point, index) => (
            <Circle
              key={`physical-${physicalValues[index].key}`}
              cx={point.x}
              cy={point.y}
              r={index === physicalWave.anchors.length - 1 ? 6 : 4}
              fill={atelierColors.surface}
              stroke={atelierColors.deepGreen}
              strokeWidth={index === physicalWave.anchors.length - 1 ? 2.5 : 2}
            />
          ))}
          {mentalWave.anchors.map((point, index) => (
            <Circle
              key={`mental-${mentalValues[index].key}`}
              cx={point.x}
              cy={point.y}
              r={index === mentalWave.anchors.length - 1 ? 5 : 3.5}
              fill={atelierColors.surfaceMuted}
              stroke={atelierColors.deepGreenSoft}
              strokeWidth={index === mentalWave.anchors.length - 1 ? 2 : 1.5}
            />
          ))}
        </Svg>

        <View style={styles.xAxis}>
          {physicalValues.map((entry, index) => {
            const x = xPositions[index];
            const isActive = index === physicalValues.length - 1;
            return (
              <View key={entry.key} style={[styles.xLabelContainer, { left: x - 20 }]}>
                <Text style={[styles.xLabel, isActive && styles.xLabelActive]}>{entry.shortLabel}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function ReportScreen() {
  const [activeTab, setActiveTab] = useState<ReportTabKey>('weekly');
  const { logs = [], isReady } = useStore();

  const report = useMemo(() => generateReportOverview(logs), [logs]);
  const normalizedLogs = useMemo(() => normalizeLogsForReport(logs), [logs]);

  const activeStats = useMemo(() => {
    if (activeTab === 'daily') return report.daily;
    if (activeTab === 'monthly') return report.monthly;
    return report.weekly;
  }, [activeTab, report]);

  const activeTabMeta = useMemo(() => 
    REPORT_TABS.find((tab) => tab.key === activeTab) ?? REPORT_TABS[1],
    [activeTab]
  );

  // Prepare chart data based on active tab
  const chartLogs = useMemo(() => {
    let targetLogs = [];
    if (activeTab === 'daily') {
      targetLogs = normalizedLogs.slice(0, 1);
    } else if (activeTab === 'weekly') {
      targetLogs = normalizedLogs.slice(0, 7);
    } else {
      targetLogs = normalizedLogs.slice(0, 14); // Limit to 14 points for readability
    }
    return [...targetLogs].reverse();
  }, [normalizedLogs, activeTab]);

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={atelierColors.deepGreen} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>WELLNESS DASHBOARD</Text>
      <Text style={styles.title}>웰니스 리포트</Text>
      <Text style={styles.caption}>나의 흐름을 데이터로 정확하게 진단합니다.</Text>

      {/* 1. Biorhythm Chart with Compact Tabs */}
      <View style={styles.biorhythmHero}>
        <View style={styles.biorhythmHeader}>
          <Text style={styles.biorhythmTitle}>바이오리듬</Text>
          <View style={styles.compactTabRow}>
            {REPORT_TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.8}
                  style={[styles.compactTab, isActive && styles.compactTabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.compactTabText, isActive && styles.compactTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <BiorhythmChart
          physicalValues={chartLogs.map((log) => {
            const dateParts = log.date.split('-');
            const shortDate = dateParts.length === 3 ? `${parseInt(dateParts[1])}/${parseInt(dateParts[2])}` : log.date;
            const p = calculatePhysicalRhythmScore(log);
            return { key: log.id + '-p', value: p.toString(), shortLabel: shortDate };
          })}
          mentalValues={chartLogs.map((log) => {
            const dateParts = log.date.split('-');
            const shortDate = dateParts.length === 3 ? `${parseInt(dateParts[1])}/${parseInt(dateParts[2])}` : log.date;
            const m = calculateMentalRhythmScore(log);
            return { key: log.id + '-m', value: m.toString(), shortLabel: shortDate };
          })}
        />
      </View>

      {/* 2. Summary Metric */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionCaption}>{activeTabMeta.helper} 종합 점수</Text>
        <View style={styles.summaryMetricRow}>
          <View style={styles.summaryMetric}>
            <Text style={styles.summaryMetricLabel}>신체 밸런스</Text>
            <Text style={styles.summaryMetricValue}>{activeStats.physicalRhythm}</Text>
          </View>
          <View style={styles.summaryMetric}>
            <Text style={styles.summaryMetricLabel}>정신 밸런스</Text>
            <Text style={styles.summaryMetricValue}>{activeStats.mentalRhythm}</Text>
          </View>
        </View>
      </View>

      {/* 3. Detailed Stats (Energy Bars) */}
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>상세 지표 분석</Text>
        <View style={styles.energyBarWrap}>
          <ReportEnergyBar label="평균 수면" value={activeStats.avgSleep} />
          <ReportEnergyBar label="평균 기분" value={activeStats.avgMood} />
          <ReportEnergyBar label="평균 피로도" value={activeStats.avgFatigue} />
          <ReportEnergyBar label="평균 스트레스" value={activeStats.avgStress} />
        </View>
      </View>

      {/* 4. Text Insights */}
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>전문가 코멘트</Text>
        <View style={styles.insightStack}>
          {activeStats.insights.slice(0, 3).map((insight) => (
            <View key={insight} style={styles.insightRow}>
              <View style={styles.insightDot} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Raw Data (Logs) */}
      <Text style={styles.subTitle}>기록 데이터</Text>
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
          <Text style={styles.emptyText}>기록이 쌓이면 데이터가 표시됩니다.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: atelierColors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxl + spacing.xl },
  eyebrow: { 
    ...atelierText.helper, 
    color: atelierColors.deepGreen,
    letterSpacing: 2, 
    marginBottom: spacing.sm 
  },
  title: { 
    ...atelierText.heroTitle, 
    fontSize: 32, 
    lineHeight: 42, 
    marginBottom: spacing.sm,
    fontWeight: '300',
    letterSpacing: -1,
  },
  caption: {
    ...atelierText.bodyMuted,
    fontSize: 16,
    lineHeight: 26,
    color: atelierColors.textMuted,
    marginBottom: spacing.xxl,
  },
  
  biorhythmHero: {
    backgroundColor: atelierColors.surface,
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: atelierColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 1,
    marginBottom: spacing.lg,
  },
  biorhythmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  biorhythmTitle: { 
    ...atelierText.cardTitleMd, 
    fontSize: 19,
    color: atelierColors.title,
  },
  compactTabRow: {
    flexDirection: 'row',
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  compactTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  compactTabActive: {
    backgroundColor: atelierColors.deepGreen,
  },
  compactTabText: {
    ...atelierText.helper,
    fontSize: 12,
    fontWeight: '600',
    color: atelierColors.textSoft,
  },
  compactTabTextActive: {
    color: '#FFF',
  },
  
  chartWrap: { width: '100%', position: 'relative' },
  chartLegendRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartLegendDot: { width: 8, height: 8, borderRadius: 4 },
  chartLegendDotPhysical: { backgroundColor: atelierColors.deepGreen },
  chartLegendDotMental: { backgroundColor: atelierColors.deepGreenSoft },
  chartLegendText: { ...atelierText.helper, color: atelierColors.textSoft, fontSize: 11 },
  chartBox: { width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  
  xAxis: {
    height: 20,
    marginTop: 8,
    position: 'absolute',
    bottom: -24,
    left: 0,
    right: 0,
  },
  xLabelContainer: {
    position: 'absolute',
    width: 40,
    alignItems: 'center',
  },
  xLabel: {
    ...atelierText.helper,
    fontSize: 11,
    color: atelierColors.textMuted,
  },
  xLabelActive: {
    color: atelierColors.deepGreen,
    fontWeight: '700',
  },
  
  summaryCard: { 
    backgroundColor: atelierColors.surface, 
    padding: spacing.xl, 
    borderRadius: 24, 
    marginBottom: spacing.lg, 
    borderWidth: 1, 
    borderColor: atelierColors.border 
  },
  sectionCaption: { ...atelierText.helper, fontSize: 13, color: atelierColors.textSoft, marginBottom: spacing.md },
  summaryMetricRow: { flexDirection: 'row', gap: spacing.sm },
  summaryMetric: { 
    backgroundColor: atelierColors.surfaceMuted, 
    borderWidth: 1, 
    borderColor: atelierColors.border, 
    flex: 1, 
    paddingVertical: spacing.md, 
    alignItems: 'center', 
    borderRadius: 18 
  },
  summaryMetricLabel: { ...atelierText.helper, color: atelierColors.textSoft, marginBottom: 4 },
  summaryMetricValue: { ...atelierText.cardTitleLg, fontSize: 24 },
  
  supportCard: { backgroundColor: atelierColors.surface, padding: spacing.xl, borderRadius: 24, marginBottom: spacing.lg, borderWidth: 1, borderColor: atelierColors.border },
  supportTitle: { ...atelierText.cardTitleMd, fontSize: 18, marginBottom: spacing.lg },
  
  /* Soft Gaming Energy Bar */
  energyBarWrap: { gap: spacing.lg },
  energyBarRow: { width: '100%' },
  energyBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  energyBarLabel: { ...atelierText.body, fontSize: 14, color: atelierColors.textMuted },
  energyBarValue: { ...atelierText.cardTitleMd, fontSize: 16, color: atelierColors.title },
  energyBarContainer: {
    height: 14,
    transform: [{ skewX: '-10deg' }], // slanted gaming look
    borderRadius: 4,
    overflow: 'hidden',
  },
  energyBarTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: atelierColors.surfaceMuted,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  energyBarFillWrap: {
    height: '100%',
    overflow: 'hidden',
  },
  energyBarGradient: {
    width: Dimensions.get('window').width - (spacing.xl * 2) - (spacing.xl * 2), // Match card width to stretch gradient properly
    height: '100%',
    backgroundColor: atelierColors.deepGreen, // Fallback if no linear gradient
    flexDirection: 'row',
  },
  energyBarDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: atelierColors.surface, // Matches background to look like a gap
    opacity: 0.8,
  },
  
  insightStack: { gap: spacing.md },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: atelierColors.deepGreenSoft, marginTop: 8 },
  insightText: { ...atelierText.body, flex: 1, lineHeight: 24, color: atelierColors.text },
  
  subTitle: { ...atelierText.cardTitleMd, marginTop: spacing.xl, marginBottom: spacing.md, color: atelierColors.title },
  historyRow: { 
    backgroundColor: atelierColors.surface, 
    borderWidth: 1, 
    borderColor: atelierColors.border, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: spacing.xl, 
    borderRadius: 24, 
    marginBottom: spacing.md, 
    gap: spacing.md 
  },
  historyTextWrap: { flex: 1, minWidth: 0 },
  historyDate: { ...atelierText.helper, fontSize: 13, color: atelierColors.deepGreen, marginBottom: 6, letterSpacing: 0.5 },
  historyMemo: { ...atelierText.bodyMuted, lineHeight: 22 },
  historyData: { flexDirection: 'row', gap: spacing.xs, flexShrink: 0 },
  historyBadge: { 
    backgroundColor: atelierColors.surfaceMuted, 
    borderWidth: 1, 
    borderColor: atelierColors.border, 
    paddingHorizontal: 10, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  historyBadgeText: { ...atelierText.pill, color: atelierColors.textMuted },
  
  emptyCard: { 
    backgroundColor: atelierColors.surfaceMuted, 
    borderWidth: 1, 
    borderColor: atelierColors.border, 
    padding: spacing.xl, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyText: { ...atelierText.bodyMuted, textAlign: 'center' },
});