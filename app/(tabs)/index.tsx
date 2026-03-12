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

  const recordCount = logs.length;
  const recommendation = getHomeRecommendation(logs, userSettings);
  const teaRecommendation = getTeaRecommendation({
    logs,
    userGoal: userSettings?.goal,
  });
  const cWaterPreferredTags: CWaterTeaMoodTag[] = useMemo(() => [
    ...(todayLog?.water && Number(todayLog.water) <= 2 ? (['clean', 'bright'] as CWaterTeaMoodTag[]) : []),
    ...(todayLog?.mood && Number(todayLog.mood) <= 2 ? (['soft', 'calm'] as CWaterTeaMoodTag[]) : []),
    ...(todayLog?.sleep && Number(todayLog.sleep) <= 2 ? (['soft', 'calm'] as CWaterTeaMoodTag[]) : []),
    ...(todayLog?.exercise && Number(todayLog.exercise) >= 4 ? (['clean', 'focus'] as CWaterTeaMoodTag[]) : []),
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
    if (!latestLogFeedback) {
      return;
    }

    const timer = setTimeout(() => {
      clearLatestLogFeedback();
    }, 3500);

    return () => clearTimeout(timer);
  }, [latestLogFeedback, clearLatestLogFeedback]);

  useEffect(() => {
    if (!syncStatusMessage || syncStatus === 'syncing') {
      return;
    }

    const timer = setTimeout(() => {
      clearSyncStatusMessage();
    }, 4000);

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
        <Text style={styles.subtitle}>
          {todayLog ? '오늘 하루의 흐름을 바탕으로 블렌드와 컨디션을 함께 정리해드릴게요.' : `아직 오늘 기록이 없어요.\n${goalMessage}가볍게 컨디션을 남기면 추천이 더 또렷해져요.`}
        </Text>
      </View>

      {latestLogFeedback ? (
        <StatusBanner message={latestLogFeedback} tone="success" />
      ) : null}

      {syncStatusMessage ? (
        <StatusBanner message={syncStatusMessage} tone={syncStatus === 'fallback' ? 'muted' : 'default'} />
      ) : null}

      <View style={styles.sectionWrap}>
        <Text style={styles.editorialSectionTitle}>오늘의 컨디션</Text>
        <View style={styles.editorialCard}>
        {todayLog ? (
          <View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>수면</Text>
              <Text style={styles.summaryValue}>{todayLog.sleep}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>기분</Text>
              <Text style={styles.summaryValue}>{todayLog.mood} / 5</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>운동</Text>
              <Text style={styles.summaryValue}>{todayLog.exercise}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>수분</Text>
              <Text style={styles.summaryValue}>{todayLog.water}</Text>
            </View>
            {todayLog.memo ? (
              <View style={styles.memoContainer}>
                <Text style={styles.memoText}>{todayLog.memo}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <EmptyStateBlock
            text="기록 탭에서 오늘 컨디션을 남겨보세요."
            ctaText="기록이 쌓이면 추천과 리포트가 더 정교해져요."
          />
        )}
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.editorialSectionTitle}>나의 웰니스</Text>
        <View style={styles.editorialCard}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={styles.statHighlight}>{recordCount}</Text>
            <Text style={styles.statText}>일째 기록 중</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <View style={styles.editorialSectionHeader}>
          <Text style={styles.editorialSectionTitle}>{recommendation.title}</Text>
          {isRecommendationFallback ? <FallbackPill label="기록 전 추천" inline /> : null}
        </View>
        <View style={styles.editorialCard}>
          <Text style={styles.recommendationText}>{recommendation.message}</Text>
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.editorialSectionTitle}>최근 기록</Text>
        <View style={styles.editorialCard}>
        {logs.length > 0 ? logs.slice(0, 3).map((log, index) => (
          <View key={log.id} style={[styles.logItem, index === Math.min(logs.length, 3) - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.logDate}>{formatDisplayDate(log.date)}</Text>
            <Text style={styles.logSummary} numberOfLines={1}>
              기분 {log.mood}점 · 수면 {log.sleep} · 운동 {log.exercise}
            </Text>
          </View>
        )) : (
          <EmptyStateBlock
            text="아직 쌓인 기록이 없어요."
            ctaText="오늘 첫 기록을 남기면 이곳에 최근 흐름이 쌓여요."
          />
        )}
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.eyebrow}>TODAY'S SIGNATURE</Text>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setIsTeaDetailVisible(true)} style={styles.signatureCard}>
          <View style={styles.signatureHeader}>
            <View style={styles.signatureBadgeRow}>
              <View style={styles.signatureBadge}>
                <Text style={styles.signatureBadgeText}>SIGNATURE</Text>
              </View>
              {isRecommendationFallback ? (
                <FallbackPill label="기본 추천" inline />
              ) : null}
            </View>
            <Text style={styles.signatureContext} numberOfLines={1}>{teaRecommendation.contextLine}</Text>
          </View>

          <View style={styles.teaCardRow}>
            <TeaThumbnail teaId={teaRecommendation.teaId} size="md" />
            <View style={styles.teaCardText}>
              <Text style={styles.teaName}>{teaRecommendation.content.name}</Text>
              <Text style={styles.teaIdentity}>{teaRecommendation.content.identityLine}</Text>
              <Text style={styles.teaSubtitle}>{teaRecommendation.content.subtitle}</Text>
              <Text style={styles.recommendationText}>{teaRecommendation.reason}</Text>
            </View>
          </View>

          <Text style={styles.teaUpdateHint}>오늘 기록을 바탕으로 추천했어요</Text>

          <View style={styles.signatureFooter}>
            <Text style={styles.detailHint}>추천 상세 보기</Text>
            <Text style={styles.signatureFooterArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </View>

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
    marginBottom: spacing.xxl,
    paddingRight: spacing.md,
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
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '400',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...atelierText.bodyMuted,
    fontSize: 16,
    lineHeight: 26,
    color: atelierColors.textSoft,
  },
  aiSectionWrap: {
    marginBottom: spacing.xxl,
  },
  editorialSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  editorialSectionLargeTitle: {
    ...atelierText.heroTitle,
    fontSize: 26,
    fontWeight: '400',
    letterSpacing: -0.5,
    marginBottom: spacing.xl,
  },
  cWaterListWrap: {
    // We add some bottom padding for the deck swiping area
    paddingBottom: spacing.xxl,
  },
  sectionWrap: {
    marginBottom: spacing.xxl,
  },
  editorialSectionTitle: {
    ...atelierText.cardTitleMd,
    fontSize: 18,
    fontWeight: '400',
    color: atelierColors.deepGreen,
    marginBottom: spacing.md,
  },
  editorialCard: {
    backgroundColor: atelierColors.surface,
    borderRadius: 32,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: atelierColors.surfaceMuted,
  },
  summaryLabel: { ...atelierText.bodyMuted, fontSize: 14, color: atelierColors.textSoft },
  summaryValue: { ...atelierText.body, fontSize: 15, fontWeight: '600', color: atelierColors.title },
  memoContainer: {
    marginTop: spacing.md,
    backgroundColor: atelierColors.surfaceMuted,
    padding: spacing.lg,
    borderRadius: 20,
  },
  memoText: { ...atelierText.body, lineHeight: 24, color: atelierColors.text },
  statText: { ...atelierText.summary, fontSize: 16, color: atelierColors.textSoft },
  statHighlight: { fontSize: 32, lineHeight: 38, fontWeight: '400', color: atelierColors.deepGreen },
  recommendationText: { ...atelierText.summary, fontSize: 16, lineHeight: 26, color: atelierColors.text },

  signatureCard: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 32,
    padding: spacing.xl,
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
  signatureBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreenSoft,
  },
  signatureBadgeText: {
    ...atelierText.pill,
    color: atelierColors.deepGreen,
    fontWeight: '600',
  },
  signatureContext: {
    flex: 1,
    textAlign: 'right',
    ...atelierText.helper,
    color: atelierColors.textSoft,
  },
  teaCardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  teaCardText: { flex: 1 },
  teaName: { ...atelierText.cardTitleLg, fontSize: 24, fontWeight: '400', marginBottom: 4 },
  teaIdentity: { ...atelierText.summary, fontSize: 15, marginBottom: 8, fontWeight: '500', color: atelierColors.deepGreen },
  teaSubtitle: { ...atelierText.helper, fontSize: 13, color: atelierColors.textSoft, marginBottom: spacing.sm },
  teaUpdateHint: { ...atelierText.helper, color: atelierColors.textSoft, marginTop: spacing.md },
  signatureFooter: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: atelierColors.border,
  },
  detailHint: { ...atelierText.helper, color: atelierColors.textSoft, fontWeight: '500' },
  signatureFooterArrow: {
    fontSize: 18,
    color: atelierColors.textSoft,
  },

  logItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: atelierColors.surfaceMuted,
  },
  logDate: { ...atelierText.helper, fontSize: 13, color: atelierColors.deepGreen, marginBottom: spacing.xs, fontWeight: '500' },
  logSummary: { ...atelierText.bodyMuted, fontSize: 15, lineHeight: 24, color: atelierColors.text }
});
