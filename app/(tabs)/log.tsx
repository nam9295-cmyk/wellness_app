import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '@/lib/theme';
import { OptionChips } from '@/components/OptionChips';
import { SectionTitle } from '@/components/SectionTitle';
import { useStore } from '@/lib/store';
import { SleepState, MealState, ExerciseState, WaterState } from '@/types';
import { useRouter } from 'expo-router';

export default function LogScreen() {
  const router = useRouter();
  const { addLog, getTodayLog } = useStore();
  const todayLog = getTodayLog();

  const [sleep, setSleep] = useState<SleepState>(todayLog?.sleep || '보통');
  const [fatigue, setFatigue] = useState<number>(todayLog?.fatigue || 3);
  const [mood, setMood] = useState<number>(todayLog?.mood || 3);
  const [meal, setMeal] = useState<MealState>(todayLog?.meal || '보통');
  const [exercise, setExercise] = useState<ExerciseState>(todayLog?.exercise || '안 함');
  const [water, setWater] = useState<WaterState>(todayLog?.water || '보통');
  const [memo, setMemo] = useState<string>(todayLog?.memo || '');

  // 탭 이동 시 화면이 다시 렌더링될 때 최신 상태 반영
  useEffect(() => {
    if (todayLog) {
      setSleep(todayLog.sleep);
      setFatigue(todayLog.fatigue);
      setMood(todayLog.mood);
      setMeal(todayLog.meal);
      setExercise(todayLog.exercise);
      setWater(todayLog.water);
      setMemo(todayLog.memo);
    }
  }, [todayLog]);

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    addLog({
      date: today,
      sleep,
      fatigue,
      mood,
      meal,
      exercise,
      water,
      memo,
    });
    Alert.alert('저장 완료', '오늘의 웰니스 상태가 기록되었습니다!', [
      { text: '확인', onPress: () => router.push('/(tabs)') }
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.mainTitle}>{todayLog ? '오늘 기록 수정하기' : '오늘 어떤 하루를 보냈나요?'}</Text>
        
        <SectionTitle title="수면 상태" />
        <OptionChips<SleepState> options={['매우 부족', '부족', '보통', '좋음', '매우 좋음']} selectedValue={sleep} onSelect={setSleep} />

        <SectionTitle title="피로도 (1: 매우 피곤 ~ 5: 활기참)" />
        <OptionChips<number> options={[1, 2, 3, 4, 5]} selectedValue={fatigue} onSelect={setFatigue} />

        <SectionTitle title="현재 기분 (1: 매우 우울 ~ 5: 매우 좋음)" />
        <OptionChips<number> options={[1, 2, 3, 4, 5]} selectedValue={mood} onSelect={setMood} />

        <SectionTitle title="식사 상태" />
        <OptionChips<MealState> options={['불규칙', '보통', '균형적']} selectedValue={meal} onSelect={setMeal} />

        <SectionTitle title="운동 여부" />
        <OptionChips<ExerciseState> options={['안 함', '가볍게', '충분히']} selectedValue={exercise} onSelect={setExercise} />

        <SectionTitle title="수분 섭취" />
        <OptionChips<WaterState> options={['부족', '보통', '충분']} selectedValue={water} onSelect={setWater} />

        <SectionTitle title="한 줄 메모" />
        <TextInput
          style={styles.textInput}
          placeholder="오늘 하루에 대해 간단히 남겨주세요."
          value={memo}
          onChangeText={setMemo}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>기록 저장하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: colors.text },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 32,
    backgroundColor: '#FAFAFA'
  },
  button: { backgroundColor: colors.primary, padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
