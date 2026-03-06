import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { Card } from '@/components/Card';

export default function ReportScreen() {
  const { logs } = useStore();

  const totalLogs = logs.length;
  const avgMood = totalLogs > 0 ? (logs.reduce((acc, cur) => acc + cur.mood, 0) / totalLogs).toFixed(1) : '0';
  const avgFatigue = totalLogs > 0 ? (logs.reduce((acc, cur) => acc + cur.fatigue, 0) / totalLogs).toFixed(1) : '0';
  
  const exerciseCount = logs.filter(l => l.exercise === '충분히' || l.exercise === '가볍게').length;
  const exerciseRate = totalLogs > 0 ? Math.round((exerciseCount / totalLogs) * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>내 웰니스 리포트</Text>
      
      <Card title="전체 통계 요약" style={{ marginBottom: 24 }}>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>평균 기분</Text>
            <Text style={styles.statValue}>{avgMood} <Text style={styles.statMax}>/ 5</Text></Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>평균 피로도</Text>
            <Text style={styles.statValue}>{avgFatigue} <Text style={styles.statMax}>/ 5</Text></Text>
          </View>
        </View>
        
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>총 기록 일수</Text>
            <Text style={styles.statValue}>{totalLogs} 일</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>운동 실천율</Text>
            <Text style={styles.statValue}>{exerciseRate}%</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.subTitle}>최신 기록 모아보기</Text>
      {logs.slice(0, 7).map(log => (
        <View key={log.id} style={styles.historyRow}>
          <Text style={styles.historyDate}>{log.date}</Text>
          <View style={styles.historyData}>
            <Text style={styles.historyBadge}>기분 {log.mood}</Text>
            <Text style={styles.historyBadge}>수면 {log.sleep}</Text>
            <Text style={styles.historyBadge}>식사 {log.meal}</Text>
          </View>
        </View>
      ))}

      {totalLogs === 0 && (
        <Text style={styles.emptyText}>기록이 모이면 리포트가 생성됩니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: colors.text },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 12, color: colors.text },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  statMax: { fontSize: 14, color: '#999', fontWeight: 'normal' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  historyDate: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  historyData: { flexDirection: 'row', gap: 6 },
  historyBadge: { backgroundColor: '#E8F5E9', color: colors.primary, fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 }
});
