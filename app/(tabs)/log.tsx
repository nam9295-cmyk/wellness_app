import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { colors, spacing } from '@/lib/theme';
import { OptionChips } from '@/components/OptionChips';
import { SectionTitle } from '@/components/SectionTitle';
import { useStore } from '@/lib/store';
import { EXERCISE_STATES, MEAL_STATES, SleepState, MealState, ExerciseState, SLEEP_STATES, WATER_STATES, WaterState } from '@/types';
import { useRouter } from 'expo-router';
import { getTodayDateString } from '@/lib/date';

export default function LogScreen() {
  const router = useRouter();
  const { addLog, getTodayLog, isReady } = useStore();
  const todayLog = getTodayLog();
  const isEditingTodayLog = Boolean(todayLog);

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

  const handleSave = async () => {
    await addLog({
      date: getTodayDateString(),
      sleep,
      fatigue,
      mood,
      meal,
      exercise,
      water,
      memo,
    });

    Alert.alert(
      isEditingTodayLog ? '수정 완료' : '저장 완료',
      isEditingTodayLog
        ? '오늘 기록을 수정했어요.\n홈과 리포트 추천도 최신 내용으로 반영됐어요.'
        : '오늘 기록을 저장했어요.\n홈과 리포트 추천도 함께 업데이트됐어요.',
      [
        { text: '확인', onPress: () => router.replace('/(tabs)') }
      ]
    );
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.mainTitle}>{isEditingTodayLog ? '오늘 기록 수정하기' : '오늘 기록 남기기'}</Text>
        <Text style={styles.subTitle}>지금 상태를 가볍게 남기면 홈과 리포트 추천이 함께 업데이트돼요.</Text>
        
        <SectionTitle title="수면 상태" />
        <OptionChips<SleepState> options={SLEEP_STATES} selectedValue={sleep} onSelect={setSleep} />

        <SectionTitle title="피로도 (1: 피곤 ~ 5: 활기참)" />
        <OptionChips<number> options={[1, 2, 3, 4, 5]} selectedValue={fatigue} onSelect={setFatigue} />

        <SectionTitle title="현재 기분 (1: 우울 ~ 5: 편안함)" />
        <OptionChips<number> options={[1, 2, 3, 4, 5]} selectedValue={mood} onSelect={setMood} />

        <SectionTitle title="식사 상태" />
        <OptionChips<MealState> options={MEAL_STATES} selectedValue={meal} onSelect={setMeal} />

        <SectionTitle title="운동 여부" />
        <OptionChips<ExerciseState> options={EXERCISE_STATES} selectedValue={exercise} onSelect={setExercise} />

        <SectionTitle title="수분 섭취" />
        <OptionChips<WaterState> options={WATER_STATES} selectedValue={water} onSelect={setWater} />

        <SectionTitle title="한 줄 메모" />
        <TextInput
          style={styles.textInput}
          placeholder="오늘 하루를 짧게 남겨보세요."
          value={memo}
          onChangeText={setMemo}
          multiline
          placeholderTextColor={colors.textLight}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>{isEditingTodayLog ? '오늘 기록 업데이트' : '오늘 기록 저장'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  mainTitle: { fontSize: 24, fontWeight: '600', marginBottom: spacing.xl, color: colors.text, letterSpacing: -0.5 },
  subTitle: { fontSize: 14, color: colors.textLight, lineHeight: 22, marginTop: -spacing.md, marginBottom: spacing.xl, letterSpacing: -0.2 },
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
