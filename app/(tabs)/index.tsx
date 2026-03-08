import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card } from '@/components/Card';
import { CustomBlendDetailModal } from '@/components/CustomBlendDetailModal';
import { TeaRecommendationDetailModal } from '@/components/TeaRecommendationDetailModal';
import { TeaThumbnail } from '@/components/TeaThumbnail';
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>{nickname}님, 안녕하세요 👋</Text>
      <Text style={styles.subtitle}>
        {todayLog ? '오늘 하루도 잘 기록했어요' : `아직 오늘 기록이 없어요.\n${goalMessage}가볍게 컨디션을 남겨볼까요?`}
      </Text>

      {latestLogFeedback ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{latestLogFeedback}</Text>
        </View>
      ) : null}

      {syncStatusMessage ? (
        <View style={[styles.syncBanner, syncStatus === 'fallback' && styles.syncBannerFallback]}>
          <Text style={[styles.syncText, syncStatus === 'fallback' && styles.syncTextFallback]}>
            {syncStatusMessage}
          </Text>
        </View>
      ) : null}
      
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
          <Text style={styles.emptyText}>기록 탭에서 오늘 컨디션을 남겨보세요.</Text>
        )}
      </Card>

      <Card title="나의 웰니스">
        <Text style={styles.statText}><Text style={styles.statHighlight}>{recordCount}</Text>일째 기록 중</Text>
      </Card>

      <Card title={recommendation.title}>
        <Text style={styles.recommendationText}>{recommendation.message}</Text>
      </Card>

      <TouchableOpacity activeOpacity={0.88} onPress={() => setIsTeaDetailVisible(true)}>
        <Card title="오늘의 추천 블렌드">
          <View style={styles.teaCardRow}>
            <TeaThumbnail teaId={teaRecommendation.teaId} size="md" />
            <View style={styles.teaCardText}>
              <Text style={styles.teaName}>{teaRecommendation.content.name}</Text>
              <Text style={styles.teaIdentity}>{teaRecommendation.content.identityLine}</Text>
              <Text style={styles.teaSubtitle}>{teaRecommendation.content.subtitle}</Text>
              <Text style={styles.recommendationText}>{teaRecommendation.reason}</Text>
            </View>
          </View>
          <Text style={styles.teaContext}>{teaRecommendation.contextLine}</Text>
          <Text style={styles.teaUpdateHint}>오늘 기록을 바탕으로 추천했어요</Text>
          <Text style={styles.detailHint}>추천 상세 보기</Text>
        </Card>
      </TouchableOpacity>

      <Card title="AI 블렌딩 제안">
        <Text style={styles.aiBlendIntro}>카카오닙 베이스 위에 오늘 흐름에 맞는 조합 3가지를 골랐어요.</Text>
        {customBlendCards.map((blend, index) => (
          (() => {
            const visualProfile = getCustomBlendVisualProfile(blend);
            const extraIngredients = blend.ingredientNames.slice(1);
            const ingredientPreview = extraIngredients.join(' · ');

            return (
              <TouchableOpacity
                key={blend.label}
                activeOpacity={0.9}
                style={[styles.aiBlendItem, index === customBlendCards.length - 1 && styles.aiBlendItemLast]}
                onPress={() => setSelectedCustomBlend(blend)}
              >
                <View style={styles.aiBlendHeader}>
                  <Text style={styles.aiBlendLabel}>{blend.toneLabel}</Text>
                  <Text style={styles.aiBlendContext}>{blend.contextLine}</Text>
                </View>
                <Text style={styles.aiBlendTitle}>{blend.displayName}</Text>
                <Text style={styles.aiBlendSummary} numberOfLines={2}>{blend.summary}</Text>
                <Text style={styles.aiBlendIngredients} numberOfLines={1}>
                  {ingredientPreview}
                </Text>

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

                <Text style={styles.aiBlendDetailHint}>탭해서 전체 재료와 저장 옵션 보기</Text>
              </TouchableOpacity>
            );
          })()
        ))}
      </Card>

      <Card title="최근 기록">
        {logs.length > 0 ? logs.slice(0, 3).map((log, index) => (
          <View key={log.id} style={[styles.logItem, index === 2 && { borderBottomWidth: 0 }]}>
            <Text style={styles.logDate}>{formatDisplayDate(log.date)}</Text>
            <Text style={styles.logSummary} numberOfLines={1}>
              기분 {log.mood}점 · 수면 {log.sleep} · 운동 {log.exercise}
            </Text>
          </View>
        )) : (
          <Text style={styles.emptyText}>아직 쌓인 기록이 없어요.</Text>
        )}
      </Card>
      
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
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  greeting: { fontSize: 26, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: colors.textLight, marginBottom: spacing.xl, lineHeight: 24, letterSpacing: -0.2 },
  feedbackBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  syncBanner: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncBannerFallback: {
    backgroundColor: colors.primaryLight + '1A',
    borderColor: colors.primaryLight,
  },
  syncText: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 20,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  syncTextFallback: {
    color: colors.text,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { fontSize: 15, color: colors.textLight },
  summaryValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  emptyText: { fontSize: 15, color: colors.textLight, fontStyle: 'italic', marginTop: spacing.xs },
  memoContainer: { marginTop: spacing.md, backgroundColor: colors.primaryLight + '15', padding: spacing.md, borderRadius: 12 },
  memoText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  statText: { fontSize: 16, color: colors.text },
  statHighlight: { fontSize: 20, fontWeight: '700', color: colors.primary },
  teaCardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  teaCardText: { flex: 1 },
  teaName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4, letterSpacing: -0.3 },
  teaIdentity: { fontSize: 14, color: colors.text, marginBottom: 4, fontWeight: '600', letterSpacing: -0.2 },
  teaSubtitle: { fontSize: 13, color: colors.primary, marginBottom: spacing.sm, fontWeight: '600' },
  recommendationText: { fontSize: 15, color: colors.text, lineHeight: 24, letterSpacing: -0.2 },
  teaContext: { fontSize: 13, color: colors.textLight, marginTop: spacing.sm, letterSpacing: -0.2 },
  teaUpdateHint: { fontSize: 12, color: colors.primary, marginTop: spacing.sm, fontWeight: '700', letterSpacing: -0.1 },
  detailHint: { fontSize: 12, color: colors.textLight, marginTop: spacing.md, fontWeight: '600', letterSpacing: -0.1 },
  aiBlendIntro: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  aiBlendItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aiBlendItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  aiBlendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: 6,
  },
  aiBlendLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  aiBlendContext: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  aiBlendTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  aiBlendSummary: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  },
  aiBlendIngredients: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: spacing.xs,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  aiBlendChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  aiBlendChip: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiBlendChipText: {
    fontSize: 12,
    color: colors.text,
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
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  aiBlendBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  aiBlendBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  aiBlendDetailHint: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  logItem: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
  logDate: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: spacing.xs },
  logSummary: { fontSize: 15, color: colors.textLight, letterSpacing: -0.2 }
});
