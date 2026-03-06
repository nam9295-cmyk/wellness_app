import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';
import { useStore } from '@/lib/store';

export default function Home() {
  const { logs, getTodayLog, isReady, userSettings } = useStore();
  const todayLog = getTodayLog();

  const recordCount = logs.length;

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
      <Text style={styles.greeting}>안녕하세요 {nickname}님! 👋</Text>
      <Text style={styles.subtitle}>
        {todayLog ? '오늘도 건강한 하루를 기록하셨군요!' : `아직 오늘의 기록이 없어요. ${goalMessage}웰니스 상태를 기록해볼까요?`}
      </Text>
      
      <Card title="오늘의 상태 요약">
        {todayLog ? (
          <View>
            <Text style={styles.cardContent}>🛌 수면: {todayLog.sleep}</Text>
            <Text style={styles.cardContent}>😊 기분: {todayLog.mood} / 5 점</Text>
            <Text style={styles.cardContent}>🏃 운동: {todayLog.exercise}</Text>
            <Text style={styles.cardContent}>💧 수분: {todayLog.water}</Text>
            {todayLog.memo ? <Text style={styles.memoText}>"{todayLog.memo}"</Text> : null}
          </View>
        ) : (
          <Text style={styles.emptyText}>가운데 [기록] 탭을 눌러 작성해주세요.</Text>
        )}
      </Card>

      <Card title="나의 웰니스 현황">
        <Text style={styles.cardContent}>🔥 지금까지 총 {recordCount}일 기록했어요!</Text>
      </Card>

      <Card title="최근 기록 타임라인">
        {logs.length > 0 ? logs.slice(0, 3).map(log => (
          <View key={log.id} style={styles.logItem}>
            <Text style={styles.logDate}>{log.date}</Text>
            <Text style={styles.logSummary} numberOfLines={1}>
              기분 {log.mood}점 | 수면 {log.sleep} | 운동 {log.exercise}
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
  content: { padding: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textLight, marginBottom: 24, lineHeight: 22 },
  cardContent: { fontSize: 16, color: '#444', marginTop: 6, lineHeight: 24 },
  emptyText: { fontSize: 15, color: colors.textLight, fontStyle: 'italic', marginTop: 8 },
  memoText: { fontSize: 14, color: '#666', marginTop: 12, fontStyle: 'italic', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 },
  logItem: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingVertical: 12 },
  logDate: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  logSummary: { fontSize: 15, color: '#555' }
});
