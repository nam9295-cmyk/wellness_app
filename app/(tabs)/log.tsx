import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { colors, spacing } from '@/lib/theme';
import { OptionChips } from '@/components/OptionChips';
import { SectionTitle } from '@/components/SectionTitle';
import { useStore } from '@/lib/store';
import { SleepState, MealState, ExerciseState, WaterState } from '@/types';
import { useRouter } from 'expo-router';

export default function LogScreen() {
  const router = useRouter();
  const { addLog, getTodayLog, isReady } = useStore();
  const todayLog = getTodayLog();

  const [sleep, setSleep] = useState<SleepState>(todayLog?.sleep || '보통');
  const [fatigue, setFatigue] = useState<number>(todayLog?.fatigue || 3);
  const [mood, setMood] = useState<number>(todayLog?.mood || 3);
  const [meal, setMeal] = useState<MealState>(todayLog?.meal || '보통');
  const [exercise, setExercise] = useState<ExerciseState>(todayLog?.exercise || '안 함');
  const [water, setWater] = useState<WaterState>(todayLog?.water || '보통');
  const [memo, setMemo] = useState<string>(todayLog?.memo || '');

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
    Alert.alert('저장 완료', '오늘의 웰니스 상태가 기록되었습니다.', [
      { text: '확인', onPress: () => router.push('/(tabs)') }
    ]);
  };

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.mainTitle}>{todayLog ? '오늘 기록 수정하기' : '오늘 하루 남기기'}</Text>
        
        <SectionTitle title="수면 상태" />
        <OptionChips<SleepState> options={['매우 부족', '부족', '보통', '좋음', '매우 좋음']} selectedValue={sleep} onSelect={setSleep} />

        <SectionTitle title="피로도 (1: 피곤 ~ 5: 활기참)" />
        <OptionChips<number> options={[1, 2, 3, 4, 5]} selectedValue={fatigue} onSelect={setFatigue} />

        <SectionTitle title="현재 기분 (1: 우울 ~ 5: 편안함)" />
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
          placeholderTextColor={colors.textLight}
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
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  mainTitle: { fontSize: 24, fontWeight: '600', marginBottom: spacing.xl, color: colors.text, letterSpacing: -0.5 },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    backgroundColor: colors.card,
    color: colors.text,
  },
  button: { backgroundColor: colors.text, padding: spacing.md, borderRadius: 16, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { color: colors.card, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }
});
