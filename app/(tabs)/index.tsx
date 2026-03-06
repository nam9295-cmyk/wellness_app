import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card } from '@/components/Card';
import { TeaRecommendationDetailModal } from '@/components/TeaRecommendationDetailModal';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { formatDisplayDate } from '@/lib/date';
import { getHomeRecommendation } from '@/lib/homeRecommendation';
import { getTeaRecommendation } from '@/lib/teaRecommendationEngine';

export default function Home() {
  const [isTeaDetailVisible, setIsTeaDetailVisible] = useState(false);
  const { logs, getTodayLog, isReady, userSettings, latestLogFeedback, clearLatestLogFeedback } = useStore();
  const todayLog = getTodayLog();

  const recordCount = logs.length;
  const recommendation = getHomeRecommendation(logs, userSettings);
  const teaRecommendation = getTeaRecommendation({
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

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const nickname = userSettings?.nickname || '회원';
  const goalMessage = userSettings?.goal ? `[${userSettings.goal}] 모드로 ` : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>안녕하세요 {nickname}님</Text>
      <Text style={styles.subtitle}>
        {todayLog ? '오늘 기록을 바탕으로 상태와 추천을 함께 살펴볼 수 있어요.' : `아직 오늘 기록이 없어요.\n${goalMessage}가볍게 컨디션을 남겨볼까요?`}
      </Text>

      {latestLogFeedback ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{latestLogFeedback}</Text>
        </View>
      ) : null}
      
      <Card title="오늘의 상태 요약">
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

      <Card title="나의 웰니스 현황">
        <Text style={styles.statText}>지금까지 총 <Text style={styles.statHighlight}>{recordCount}</Text>일 기록했어요.</Text>
      </Card>

      <Card title={recommendation.title}>
        <Text style={styles.recommendationText}>{recommendation.message}</Text>
      </Card>

      <TouchableOpacity activeOpacity={0.88} onPress={() => setIsTeaDetailVisible(true)}>
        <Card title="오늘의 티 추천">
          <View style={styles.teaCardRow}>
            <TeaThumbnail teaId={teaRecommendation.teaId} size="md" />
            <View style={styles.teaCardText}>
              <Text style={styles.teaName}>{teaRecommendation.content.name}</Text>
              <Text style={styles.teaSubtitle}>{teaRecommendation.content.subtitle}</Text>
              <Text style={styles.recommendationText}>{teaRecommendation.reason}</Text>
            </View>
          </View>
          <Text style={styles.teaContext}>{teaRecommendation.contextLine}</Text>
          <Text style={styles.teaUpdateHint}>오늘 기록 기준으로 바로 반영된 추천이에요.</Text>
          <Text style={styles.detailHint}>눌러서 추천 티를 자세히 보기</Text>
        </Card>
      </TouchableOpacity>

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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { fontSize: 15, color: colors.textLight },
  summaryValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  emptyText: { fontSize: 15, color: colors.textLight, fontStyle: 'italic', marginTop: spacing.xs },
  memoContainer: { marginTop: spacing.md, backgroundColor: colors.primaryLight + '15', padding: spacing.md, borderRadius: 12 },
  memoText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  statText: { fontSize: 16, color: colors.text },
  statHighlight: { fontSize: 20, fontWeight: '700', color: colors.primary },
  teaCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  teaCardText: { flex: 1 },
  teaName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4, letterSpacing: -0.3 },
  teaSubtitle: { fontSize: 13, color: colors.primary, marginBottom: spacing.sm, fontWeight: '600' },
  recommendationText: { fontSize: 15, color: colors.text, lineHeight: 24, letterSpacing: -0.2 },
  teaContext: { fontSize: 13, color: colors.textLight, marginTop: spacing.sm, letterSpacing: -0.2 },
  teaUpdateHint: { fontSize: 12, color: colors.primary, marginTop: spacing.sm, fontWeight: '700', letterSpacing: -0.1 },
  detailHint: { fontSize: 12, color: colors.textLight, marginTop: spacing.md, fontWeight: '600', letterSpacing: -0.1 },
  logItem: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
  logDate: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: spacing.xs },
  logSummary: { fontSize: 15, color: colors.textLight, letterSpacing: -0.2 }
});
