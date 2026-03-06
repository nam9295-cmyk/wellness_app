import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from '@/components/Card';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { formatDisplayDate } from '@/lib/date';
import { getHomeRecommendation } from '@/lib/homeRecommendation';

export default function Home() {
  const { logs, getTodayLog, isReady, userSettings } = useStore();
  const todayLog = getTodayLog();

  const recordCount = logs.length;
  const recommendation = getHomeRecommendation(logs, userSettings);

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
        {todayLog ? '오늘도 건강한 하루를 기록하셨군요.' : `아직 오늘의 기록이 없어요.\n${goalMessage}웰니스 상태를 기록해볼까요?`}
      </Text>
      
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
          <Text style={styles.emptyText}>가운데 기록 탭을 눌러 작성해주세요.</Text>
        )}
      </Card>

      <Card title="나의 웰니스 현황">
        <Text style={styles.statText}>지금까지 총 <Text style={styles.statHighlight}>{recordCount}</Text>일 기록했어요.</Text>
      </Card>

      <Card title={recommendation.title}>
        <Text style={styles.recommendationText}>{recommendation.message}</Text>
      </Card>

      <Card title="최근 기록 타임라인">
        {logs.length > 0 ? logs.slice(0, 3).map((log, index) => (
          <View key={log.id} style={[styles.logItem, index === 2 && { borderBottomWidth: 0 }]}>
            <Text style={styles.logDate}>{formatDisplayDate(log.date)}</Text>
            <Text style={styles.logSummary} numberOfLines={1}>
              기분 {log.mood}점 · 수면 {log.sleep} · 운동 {log.exercise}
            </Text>
          </View>
        )) : (
          <Text style={styles.emptyText}>기록이 없습니다.</Text>
        )}
      </Card>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  greeting: { fontSize: 26, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: colors.textLight, marginBottom: spacing.xl, lineHeight: 24, letterSpacing: -0.2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { fontSize: 15, color: colors.textLight },
  summaryValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  emptyText: { fontSize: 15, color: colors.textLight, fontStyle: 'italic', marginTop: spacing.xs },
  memoContainer: { marginTop: spacing.md, backgroundColor: colors.primaryLight + '15', padding: spacing.md, borderRadius: 12 },
  memoText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  statText: { fontSize: 16, color: colors.text },
  statHighlight: { fontSize: 20, fontWeight: '700', color: colors.primary },
  recommendationText: { fontSize: 15, color: colors.text, lineHeight: 24, letterSpacing: -0.2 },
  logItem: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
  logDate: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: spacing.xs },
  logSummary: { fontSize: 15, color: colors.textLight, letterSpacing: -0.2 }
});
