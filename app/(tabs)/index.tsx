import { useEffect, useState } from 'react';
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
import {
  CustomBlendOption,
  getCustomBlendRecommendations,
  getCustomBlendVisualProfile,
} from '@/lib/customBlendEngine';
import { getHomeRecommendation } from '@/lib/homeRecommendation';
import { getTeaRecommendation } from '@/lib/teaRecommendationEngine';

export default function Home() {
  const [isTeaDetailVisible, setIsTeaDetailVisible] = useState(false);
  const [selectedCustomBlend, setSelectedCustomBlend] = useState<CustomBlendOption | null>(null);
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
  const customBlendRecommendations = getCustomBlendRecommendations({
    logs,
    userGoal: userSettings?.goal,
  });

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const nickname = userSettings?.nickname || '회원';
  const goalMessage = userSettings?.goal ? `[${userSettings.goal}] 모드로 ` : '';
  const customBlendCards: CustomBlendOption[] = [
    customBlendRecommendations.best,
    customBlendRecommendations.refreshingAlternative,
    customBlendRecommendations.softAlternative,
  ];
  const isRecommendationFallback = logs.length === 0;
  const toneMetaByType = {
    best: { badge: 'BEST', label: '가장 잘 맞는 조합' },
    fresh: { badge: 'FRESH', label: '더 산뜻한 대안' },
    soft: { badge: 'SOFT', label: '더 부드러운 대안' },
  } as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Card title="오늘의 컨디션">
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
            <View style={styles.summaryRow}>
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
        </Card>
      </View>

      <View style={styles.sectionWrap}>
        <Card title="나의 웰니스">
        <Text style={styles.statText}><Text style={styles.statHighlight}>{recordCount}</Text>일째 기록 중</Text>
        </Card>
      </View>

      <View style={styles.sectionWrap}>
        <Card title={recommendation.title}>
        {isRecommendationFallback ? (
          <FallbackPill label="기록 전 추천" />
        ) : null}
        <Text style={styles.recommendationText}>{recommendation.message}</Text>
        </Card>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.atelierSectionLabel}>TODAY&apos;S SIGNATURE</Text>
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
            <Text style={styles.signatureFooterArrow}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.aiSectionWrap}>
        <Card title="AI 블렌딩 제안">
        {isRecommendationFallback ? (
          <FallbackPill label="기록 전 추천" />
        ) : null}
        <Text style={styles.aiBlendIntro}>카카오닙 베이스 위에 오늘 흐름에 맞는 조합 3가지를 골랐어요.</Text>
        {customBlendCards.map((blend, index) => (
          (() => {
            const visualProfile = getCustomBlendVisualProfile(blend);
            const extraIngredients = blend.ingredientNames.slice(1);
            const ingredientPreview = extraIngredients.join(' · ');
            const toneMeta = toneMetaByType[blend.recommendationType];

            return (
              <TouchableOpacity
                key={blend.label}
                activeOpacity={0.9}
                style={[styles.aiBlendItem, index === customBlendCards.length - 1 && styles.aiBlendItemLast]}
                onPress={() => setSelectedCustomBlend(blend)}
              >
                <View style={styles.aiBlendHeader}>
                  <View style={styles.aiBlendToneWrap}>
                    <View style={styles.aiBlendToneBadge}>
                      <Text style={styles.aiBlendToneBadgeText}>{toneMeta.badge}</Text>
                    </View>
                    <Text style={styles.aiBlendLabel}>{toneMeta.label}</Text>
                  </View>
                  <Text style={styles.aiBlendContext} numberOfLines={1}>{blend.contextLine}</Text>
                </View>
                <Text style={styles.aiBlendTitle}>{blend.displayName}</Text>
                <Text style={styles.aiBlendSummary} numberOfLines={2}>{blend.summary}</Text>
                <Text style={styles.aiBlendDetail} numberOfLines={2}>{blend.detail}</Text>

                <View style={styles.aiBlendMetaCard}>
                  <Text style={styles.aiBlendMetaLabel}>추가 재료</Text>
                  <Text style={styles.aiBlendIngredients} numberOfLines={1}>
                    {ingredientPreview}
                  </Text>
                </View>

                <View style={styles.aiBlendChipWrap}>
                  {visualProfile.chips.slice(0, 3).map((chip) => (
                    <View key={chip} style={styles.aiBlendChip}>
                      <Text style={styles.aiBlendChipText}>{chip}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.aiBlendBars}>
                  {visualProfile.bars.map((bar) => (
                    <View key={bar.key} style={styles.aiBlendBarRow}>
                      <Text style={styles.aiBlendBarLabel}>{bar.label}</Text>
                      <View style={styles.aiBlendBarTrack}>
                        <View style={[styles.aiBlendBarFill, { width: `${(bar.value / 5) * 100}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.aiBlendFooter}>
                  <Text style={styles.aiBlendDetailHint}>상세 보기</Text>
                  <Text style={styles.aiBlendFooterArrow}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })()
        ))}
        </Card>
      </View>

      <View style={styles.sectionWrap}>
        <Card title="최근 기록">
        {logs.length > 0 ? logs.slice(0, 3).map((log, index) => (
          <View key={log.id} style={[styles.logItem, index === 2 && { borderBottomWidth: 0 }]}>
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
        </Card>
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  heroIntro: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...atelierText.helper,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  greeting: {
    ...atelierText.heroTitle,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...atelierText.summary,
    color: atelierColors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 25,
  },
  sectionWrap: {
    marginBottom: spacing.lg,
  },
  aiSectionWrap: {
    marginBottom: spacing.xl,
  },
  atelierSectionLabel: {
    ...atelierText.helper,
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { fontSize: 15, color: colors.textLight },
  summaryValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  memoContainer: { marginTop: spacing.md, backgroundColor: colors.primaryLight + '15', padding: spacing.md, borderRadius: 12 },
  memoText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  statText: { fontSize: 16, color: colors.text },
  statHighlight: { fontSize: 20, fontWeight: '700', color: colors.primary },
  signatureCard: {
    ...atelierCards.hero,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  signatureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  signatureBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreenMuted,
    borderWidth: 1,
    borderColor: '#CEDCD5',
  },
  signatureBadgeText: {
    ...atelierText.pill,
  },
  signatureContext: {
    flex: 1,
    textAlign: 'right',
    ...atelierText.helper,
    color: atelierColors.textSoft,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  teaCardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  teaCardText: { flex: 1 },
  teaName: { ...atelierText.cardTitleLg, marginBottom: 4 },
  teaIdentity: { ...atelierText.summary, fontSize: 15, marginBottom: 4, fontWeight: '600', lineHeight: 22 },
  teaSubtitle: { ...atelierText.helper, fontSize: 13, color: atelierColors.deepGreen, marginBottom: spacing.sm, letterSpacing: -0.1 },
  recommendationText: { ...atelierText.summary, fontSize: 15 },
  teaUpdateHint: { ...atelierText.helper, color: atelierColors.deepGreen, marginTop: spacing.md, letterSpacing: -0.1 },
  signatureFooter: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: atelierColors.border,
  },
  detailHint: { ...atelierText.helper, color: atelierColors.textMuted, fontWeight: '600', letterSpacing: -0.1 },
  signatureFooterArrow: {
    fontSize: 20,
    color: atelierColors.deepGreen,
    fontWeight: '500',
    lineHeight: 20,
  },
  aiBlendIntro: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  aiBlendItem: {
    ...atelierCards.section,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  aiBlendItemLast: {
    marginBottom: 0,
  },
  aiBlendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  aiBlendToneWrap: {
    flexShrink: 1,
    gap: 6,
  },
  aiBlendToneBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreenMuted,
    borderBottomWidth: 1,
    borderColor: '#CEDCD5',
  },
  aiBlendToneBadgeText: {
    ...atelierText.pill,
  },
  aiBlendLabel: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
    letterSpacing: -0.1,
  },
  aiBlendContext: {
    flex: 1,
    textAlign: 'right',
    ...atelierText.helper,
    color: atelierColors.textSoft,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  aiBlendTitle: {
    ...atelierText.cardTitleLg,
    marginBottom: spacing.xs,
  },
  aiBlendSummary: {
    ...atelierText.summary,
    fontSize: 15,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  aiBlendDetail: {
    ...atelierText.bodyMuted,
    fontSize: 13,
    lineHeight: 21,
    letterSpacing: -0.1,
    marginBottom: spacing.md,
  },
  aiBlendMetaCard: {
    ...atelierCards.meta,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  aiBlendMetaLabel: {
    ...atelierText.helper,
    fontSize: 11,
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  aiBlendIngredients: {
    ...atelierText.body,
    fontSize: 13,
    color: atelierColors.deepGreen,
    lineHeight: 20,
    fontWeight: '600',
  },
  aiBlendChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  aiBlendChip: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  aiBlendChipText: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.text,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  aiBlendBars: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  aiBlendBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiBlendBarLabel: {
    width: 54,
    ...atelierText.helper,
    color: atelierColors.textSoft,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  aiBlendBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: atelierColors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  aiBlendBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreen,
  },
  aiBlendFooter: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: atelierColors.border,
  },
  aiBlendDetailHint: {
    ...atelierText.helper,
    color: atelierColors.textMuted,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  aiBlendFooterArrow: {
    fontSize: 20,
    color: atelierColors.deepGreen,
    fontWeight: '500',
    lineHeight: 20,
  },
  logItem: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
  logDate: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: spacing.xs },
  logSummary: { fontSize: 15, color: colors.textLight, letterSpacing: -0.2 }
});
