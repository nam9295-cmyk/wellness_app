import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card } from '@/components/Card';
import { CustomBlendDetailModal } from '@/components/CustomBlendDetailModal';
import { EmptyStateBlock } from '@/components/EmptyStateBlock';
import { FallbackPill } from '@/components/FallbackPill';
import { StatusBanner } from '@/components/StatusBanner';
import { TeaRecommendationDetailModal } from '@/components/TeaRecommendationDetailModal';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { formatDisplayDate } from '@/lib/date';
import { CWaterBlendResult, getTopCWaterBlendResults } from '@/lib/cwaterBlendEngine';
import { CWaterSwipeDeck } from '@/components/CWaterSwipeDeck';
import { CWaterTeaMoodTag, CWaterTeaTimeTag } from '@/lib/cwaterTeaMetadata';
import { getHomeRecommendation } from '@/lib/homeRecommendation';
import { getTeaRecommendation } from '@/lib/teaRecommendationEngine';
import {
  normalizeExerciseScore,
  normalizeMoodScore,
  normalizeSleepScore,
  normalizeWaterScore,
  normalizeFatigueScore,
  normalizeStressScore,
  normalizeMealScore,
} from '@/lib/wellnessScoring';
import Svg, { Circle, G } from 'react-native-svg';

const ConditionRing = ({ label, value }: { label: string, value: number | undefined }) => {
  const numValue = value ?? 0;
  const percentage = Math.min(Math.max((numValue / 5) * 100, 0), 100);
  
  const size = 64;
  const strokeWidth = 6;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.ringItem}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            <Circle
              stroke={atelierColors.track}
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              stroke={atelierColors.deepGreen}
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>
        <Text style={styles.ringValue}>{numValue}</Text>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
};

export default function Home() {
  const [isTeaDetailVisible, setIsTeaDetailVisible] = useState(false);
  const [selectedCustomBlend, setSelectedCustomBlend] = useState<CWaterBlendResult | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const {
    logs,
    getTodayLog,
    isReady,
    userSettings,
    latestLogFeedback,
    clearLatestLogFeedback,
    syncStatus,
    syncStatusMessage,
    clearSyncStatusMessage,
  } = useStore();
  const todayLog = getTodayLog();
  const todayConditionScores = useMemo(() => {
    if (!todayLog) {
      return null;
    }

    return {
      sleep: normalizeSleepScore(todayLog.sleep),
      mood: normalizeMoodScore(todayLog.mood),
      exercise: normalizeExerciseScore(todayLog.exercise),
      water: normalizeWaterScore(todayLog.water),
      fatigue: normalizeFatigueScore(todayLog.fatigue),
      stress: normalizeStressScore(todayLog.stress),
      meal: normalizeMealScore(todayLog.meal),
    };
  }, [todayLog]);

  const recordCount = logs.length;
  const recommendation = getHomeRecommendation(logs, userSettings);
  const teaRecommendation = getTeaRecommendation({
    logs,
    userGoal: userSettings?.goal,
  });
  
  const cWaterPreferredTags: CWaterTeaMoodTag[] = useMemo(() => [
    ...(todayLog?.water && normalizeWaterScore(todayLog.water) <= 2 ? (['clean', 'bright'] as CWaterTeaMoodTag[]) : []),
    ...(todayLog?.mood && normalizeMoodScore(todayLog.mood) <= 2 ? (['soft', 'calm'] as CWaterTeaMoodTag[]) : []),
    ...(todayLog?.sleep && normalizeSleepScore(todayLog.sleep) <= 2 ? (['soft', 'calm'] as CWaterTeaMoodTag[]) : []),
    ...(todayLog?.exercise && normalizeExerciseScore(todayLog.exercise) >= 4 ? (['clean', 'focus'] as CWaterTeaMoodTag[]) : []),
    ...(userSettings?.goal === '기분 관리' ? (['bright', 'juicy'] as CWaterTeaMoodTag[]) : []),
    ...(userSettings?.goal === '수면 관리' ? (['soft', 'calm'] as CWaterTeaMoodTag[]) : []),
    ...(userSettings?.goal === '피로 관리' ? (['focus', 'deep'] as CWaterTeaMoodTag[]) : []),
    ...(userSettings?.goal === '식습관 관리' ? (['clean', 'citrus'] as CWaterTeaMoodTag[]) : []),
  ], [todayLog, userSettings]);

  const cWaterPreferredTime: CWaterTeaTimeTag = useMemo(() => {
      const hour = new Date().getHours();
      if (hour < 11) return 'morning';
      if (hour < 17) return 'afternoon';
      if (hour < 22) return 'evening';
      return 'lateNight';
  }, []);

  const cWaterResults = useMemo(() => getTopCWaterBlendResults({
    preferredTags: cWaterPreferredTags,
    preferredTimes: [cWaterPreferredTime],
    maxResults: 3,
  }), [cWaterPreferredTags, cWaterPreferredTime]);

  useEffect(() => {
    if (!latestLogFeedback) return;
    const timer = setTimeout(() => clearLatestLogFeedback(), 3500);
    return () => clearTimeout(timer);
  }, [latestLogFeedback, clearLatestLogFeedback]);

  useEffect(() => {
    if (!syncStatusMessage || syncStatus === 'syncing') return;
    const timer = setTimeout(() => clearSyncStatusMessage(), 4000);
    return () => clearTimeout(timer);
  }, [syncStatus, syncStatusMessage, clearSyncStatusMessage]);

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={atelierColors.deepGreen} />
      </View>
    );
  }

  const nickname = userSettings?.nickname || '회원';
  const goalMessage = userSettings?.goal ? `[${userSettings.goal}] 모드로 ` : '';
  const isRecommendationFallback = logs.length === 0;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content} 
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isSwipeActive}
    >
      <View style={styles.heroIntro}>
        <Text style={styles.eyebrow}>WELLNESS ATELIER</Text>
        <Text style={styles.greeting}>{nickname}님, 안녕하세요</Text>
        
        <View style={styles.recordBadgeRow}>
          <View style={styles.recordBadge}>
            <Text style={styles.recordBadgeText}>{recordCount}일째 기록 중</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {todayLog ? '오늘 하루의 흐름을 바탕으로 블렌드와 컨디션을 함께 정리해드릴게요.' : `아직 오늘 기록이 없어요.\n${goalMessage}가볍게 컨디션을 남기면 추천이 더 또렷해져요.`}
        </Text>
      </View>

      {latestLogFeedback ? (
        <View style={{ marginBottom: spacing.xl }}>
          <StatusBanner message={latestLogFeedback} tone="success" />
        </View>
      ) : null}

      {syncStatusMessage ? (
        <View style={{ marginBottom: spacing.xl }}>
          <StatusBanner message={syncStatusMessage} tone={syncStatus === 'fallback' ? 'muted' : 'default'} />
        </View>
      ) : null}

      {/* 컨디션 요약 */}
      <View style={[styles.sectionWrap, { marginHorizontal: -spacing.xl }]}>
        <Text style={[styles.editorialSectionTitle, { paddingHorizontal: spacing.xl }]}>오늘의 컨디션</Text>
        {todayLog ? (
          <View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.ringScrollContent}
              snapToInterval={80}
              decelerationRate="fast"
            >
              <ConditionRing label="수면" value={todayConditionScores?.sleep} />
              <ConditionRing label="피로도" value={todayConditionScores?.fatigue} />
              <ConditionRing label="기분" value={todayConditionScores?.mood} />
              <ConditionRing label="스트레스" value={todayConditionScores?.stress} />
              <ConditionRing label="식사" value={todayConditionScores?.meal} />
              <ConditionRing label="운동" value={todayConditionScores?.exercise} />
              <ConditionRing label="수분" value={todayConditionScores?.water} />
            </ScrollView>
            {todayLog.memo ? (
              <View style={[styles.memoContainer, { marginHorizontal: spacing.xl }]}>
                <Text style={styles.memoText}>{todayLog.memo}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <EmptyStateBlock
              text="기록 탭에서 오늘 컨디션을 남겨보세요."
              ctaText="기록이 쌓이면 추천과 리포트가 더 정교해져요."
            />
          </View>
        )}
      </View>

      {/* 홈 추천 코멘트 */}
      <View style={styles.sectionWrap}>
        <View style={styles.editorialSectionHeader}>
          <Text style={styles.editorialSectionTitle}>{recommendation.title}</Text>
          {isRecommendationFallback ? <FallbackPill label="기록 전" inline /> : null}
        </View>
        <View style={styles.reportCard}>
          <Text style={styles.reportText}>{recommendation.message}</Text>
        </View>
      </View>

      {/* 가로 스와이프 최근 기록 */}
      <View style={[styles.sectionWrap, { marginHorizontal: -spacing.xl }]}>
        <Text style={[styles.editorialSectionTitle, { paddingHorizontal: spacing.xl }]}>최근 기록</Text>
        {logs.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
            snapToInterval={140 + spacing.md}
            decelerationRate="fast"
          >
            {logs.slice(0, 5).map((log) => (
              <View key={log.id} style={styles.logTile}>
                <Text style={styles.logTileDate}>{formatDisplayDate(log.date)}</Text>
                <View style={styles.logTileStats}>
                  <Text style={styles.logTileStatText}>기분 {log.mood}</Text>
                  <Text style={styles.logTileStatText}>수면 {log.sleep}</Text>
                  <Text style={styles.logTileStatText}>운동 {log.exercise}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <EmptyStateBlock
              text="아직 쌓인 기록이 없어요."
              ctaText="오늘 첫 기록을 남기면 이곳에 최근 흐름이 쌓여요."
            />
          </View>
        )}
      </View>

      {/* 시그니처 블렌드 */}
      <View style={styles.sectionWrap}>
        <Text style={styles.eyebrow}>TODAY'S SIGNATURE</Text>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setIsTeaDetailVisible(true)} style={styles.signatureMinimal}>
          <View style={styles.signatureHeader}>
            <View style={styles.signatureBadgeRow}>
              {isRecommendationFallback ? (
                <FallbackPill label="기본 추천" inline />
              ) : null}
            </View>
            <Text style={styles.signatureContext} numberOfLines={1}>{teaRecommendation.contextLine}</Text>
          </View>

          <View style={styles.teaCardRow}>
            <TeaThumbnail teaId={teaRecommendation.teaId} size="lg" />
            <View style={styles.teaCardText}>
              <Text style={styles.teaName}>{teaRecommendation.content.name}</Text>
              <Text style={styles.teaIdentity}>{teaRecommendation.content.identityLine}</Text>
              <Text style={styles.teaSubtitle}>{teaRecommendation.content.subtitle}</Text>
            </View>
          </View>

          <View style={styles.editorialQuote}>
            <Text style={styles.recommendationText}>{teaRecommendation.reason}</Text>
          </View>

          <View style={styles.signatureFooter}>
            <Text style={styles.detailHint}>추천 상세 보기</Text>
            <Text style={styles.signatureFooterArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* C.Water */}
      <View style={styles.aiSectionWrap}>
        <View style={styles.editorialSectionHeader}>
          <Text style={styles.eyebrow}>C.WATER CURATED</Text>
          {isRecommendationFallback ? <FallbackPill label="기록 전 추천" inline /> : null}
        </View>
        <Text style={styles.editorialSectionLargeTitle}>지금 흐름에 맞는 C.Water 제안</Text>
        
        <View style={styles.cWaterListWrap}>
          <CWaterSwipeDeck 
            blends={cWaterResults} 
            onSelect={(blend) => setSelectedCustomBlend(blend)} 
            onSwipeStart={() => setIsSwipeActive(true)}
            onSwipeEnd={() => setIsSwipeActive(false)}
          />
        </View>
      </View>

      <TeaRecommendationDetailModal
        visible={isTeaDetailVisible}
        recommendation={teaRecommendation}
        onClose={() => setIsTeaDetailVisible(false)}
      />
      <CustomBlendDetailModal
        visible={Boolean(selectedCustomBlend)}
        option={selectedCustomBlend}
        onClose={() => setSelectedCustomBlend(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: atelierColors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxl + spacing.xl },
  heroIntro: {
    marginBottom: spacing.xxl + spacing.md,
    paddingRight: spacing.sm,
  },
  eyebrow: {
    ...atelierText.helper,
    color: atelierColors.deepGreen,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  greeting: {
    ...atelierText.heroTitle,
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '300',
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  recordBadgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  recordBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: atelierColors.surfaceMuted,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  recordBadgeText: {
    ...atelierText.helper,
    fontSize: 13,
    color: atelierColors.textMuted,
    fontWeight: '500',
  },
  subtitle: {
    ...atelierText.bodyMuted,
    fontSize: 16,
    lineHeight: 28,
    color: atelierColors.textMuted,
  },
  
  sectionWrap: {
    marginBottom: spacing.xxl + spacing.md,
  },
  editorialSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  editorialSectionTitle: {
    ...atelierText.cardTitleMd,
    fontSize: 19,
    fontWeight: '500',
    color: atelierColors.title,
    letterSpacing: -0.4,
    marginBottom: spacing.lg,
  },
  editorialSectionLargeTitle: {
    ...atelierText.heroTitle,
    fontSize: 26,
    fontWeight: '400',
    letterSpacing: -0.5,
    marginBottom: spacing.xl,
  },
  
  /* Ring Grid (Horizontal Scroll) */
  ringScrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  ringItem: {
    alignItems: 'center',
    width: 64, // Keep consistent width for scrolling
  },
  ringValue: {
    ...atelierText.heroTitle,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.5,
    color: atelierColors.title,
  },
  ringLabel: {
    ...atelierText.bodyMuted,
    fontSize: 14,
    color: atelierColors.textMuted,
  },
  
  /* Report Card */
  reportCard: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  reportText: {
    ...atelierText.body,
    fontSize: 16,
    lineHeight: 28,
    color: atelierColors.text,
  },

  /* Editorial Quote / Recommendation */
  editorialQuote: {
    borderLeftWidth: 2,
    borderLeftColor: atelierColors.deepGreen,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.xs,
  },
  recommendationText: {
    ...atelierText.summary,
    fontSize: 16,
    lineHeight: 26,
    color: atelierColors.text,
  },

  /* Memo */
  memoContainer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: atelierColors.border,
  },
  memoText: {
    ...atelierText.body,
    lineHeight: 24,
    color: atelierColors.textMuted,
    fontStyle: 'italic',
  },

  /* Horizontal Logs */
  horizontalScrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  logTile: {
    width: 140,
    backgroundColor: atelierColors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  logTileDate: {
    ...atelierText.helper,
    color: atelierColors.deepGreen,
    marginBottom: spacing.md,
  },
  logTileStats: {
    gap: 4,
  },
  logTileStatText: {
    ...atelierText.bodyMuted,
    fontSize: 13,
  },

  /* Signature Minimal Card */
  signatureMinimal: {
    borderTopWidth: 1,
    borderTopColor: atelierColors.border,
    paddingTop: spacing.xl,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  signatureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signatureContext: {
    flex: 1,
    textAlign: 'right',
    ...atelierText.helper,
    color: atelierColors.textSoft,
  },
  teaCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  teaCardText: {
    flex: 1,
  },
  teaName: {
    ...atelierText.cardTitleLg,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  teaIdentity: {
    ...atelierText.summary,
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '500',
    color: atelierColors.deepGreen,
  },
  teaSubtitle: {
    ...atelierText.helper,
    fontSize: 13,
    color: atelierColors.textSoft,
  },
  signatureFooter: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  detailHint: {
    ...atelierText.helper,
    color: atelierColors.textMuted,
    fontWeight: '600',
  },
  signatureFooterArrow: {
    fontSize: 18,
    color: atelierColors.deepGreen,
  },

  aiSectionWrap: {
    marginBottom: spacing.xxl,
  },
  cWaterListWrap: {
    paddingBottom: spacing.xxl,
  },
});
