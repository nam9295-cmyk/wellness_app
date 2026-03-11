import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { atelierButtons, atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
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
        ? '기록이 저장됐고, 추천도 함께 반영됐어요.'
        : '기록이 저장됐고, 추천도 함께 반영됐어요.',
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
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>TODAY&apos;S CHECK-IN</Text>
          <Text style={styles.mainTitle}>{isEditingTodayLog ? '오늘 기록 수정' : '오늘 컨디션 남기기'}</Text>
          <Text style={styles.subTitle}>상태를 남기면 추천이 함께 업데이트돼요.</Text>
        </View>
        
        <SectionTitle title="수면 상태" />
        <OptionChips<SleepState> options={SLEEP_STATES} selectedValue={sleep} onSelect={setSleep} />

        <SectionTitle title="피로도 (1 피곤 – 5 활기참)" />
        <OptionChips<number> options={[1, 2, 3, 4, 5]} selectedValue={fatigue} onSelect={setFatigue} />

        <SectionTitle title="기분 (1 우울 – 5 편안함)" />
        <OptionChips<number> options={[1, 2, 3, 4, 5]} selectedValue={mood} onSelect={setMood} />

        <SectionTitle title="식사 상태" />
        <OptionChips<MealState> options={MEAL_STATES} selectedValue={meal} onSelect={setMeal} />

        <SectionTitle title="운동 여부" />
        <OptionChips<ExerciseState> options={EXERCISE_STATES} selectedValue={exercise} onSelect={setExercise} />

        <SectionTitle title="수분 섭취" />
        <OptionChips<WaterState> options={WATER_STATES} selectedValue={water} onSelect={setWater} />

        <SectionTitle title="한 줄 메모" />
        <View style={styles.memoCard}>
          <TextInput
            style={styles.textInput}
            placeholder="오늘 하루를 짧게 남겨보세요."
            value={memo}
            onChangeText={setMemo}
            multiline
            placeholderTextColor={atelierColors.textSoft}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>{isEditingTodayLog ? '기록 수정하기' : '기록 저장하기'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: atelierColors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heroCard: {
    ...atelierCards.hero,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...atelierText.helper,
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
  },
  mainTitle: {
    ...atelierText.heroTitle,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  subTitle: {
    ...atelierText.summary,
    color: atelierColors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  memoCard: {
    ...atelierCards.section,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  textInput: {
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    backgroundColor: 'transparent',
    color: atelierColors.text,
  },
  button: {
    ...atelierButtons.primarySolid,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    ...atelierText.summary,
    color: atelierColors.surface,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  }
});
