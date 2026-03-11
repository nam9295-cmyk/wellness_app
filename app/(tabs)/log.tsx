import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { atelierButtons, atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';
import { SectionTitle } from '@/components/SectionTitle';
import { useStore } from '@/lib/store';
import { ExerciseState, MealState, SleepState, WaterState } from '@/types';
import { useRouter } from 'expo-router';
import { getTodayDateString } from '@/lib/date';
import {
  getScoreLabel,
  normalizeExerciseScore,
  normalizeFatigueScore,
  normalizeMealScore,
  normalizeMoodScore,
  normalizeSleepScore,
  normalizeStressScore,
  normalizeWaterScore,
} from '@/lib/wellnessScoring';

function ScoreChips({
  selectedValue,
  onSelect,
}: {
  selectedValue: number;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={styles.scoreChipWrap}>
      {[1, 2, 3, 4, 5].map((score) => {
        const isSelected = score === selectedValue;

        return (
          <TouchableOpacity
            key={score}
            style={[styles.scoreChip, isSelected && styles.scoreChipSelected]}
            activeOpacity={0.9}
            onPress={() => onSelect(score)}
          >
            <Text style={[styles.scoreChipText, isSelected && styles.scoreChipTextSelected]}>
              {score}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function LogScreen() {
  const router = useRouter();
  const { addLog, getTodayLog, isReady } = useStore();
  const todayLog = getTodayLog();
  const isEditingTodayLog = Boolean(todayLog);

  const [sleep, setSleep] = useState<number>(normalizeSleepScore(todayLog?.sleep));
  const [fatigue, setFatigue] = useState<number>(normalizeFatigueScore(todayLog?.fatigue));
  const [mood, setMood] = useState<number>(normalizeMoodScore(todayLog?.mood));
  const [stress, setStress] = useState<number>(normalizeStressScore(undefined));
  const [meal, setMeal] = useState<number>(normalizeMealScore(todayLog?.meal));
  const [exercise, setExercise] = useState<number>(normalizeExerciseScore(todayLog?.exercise));
  const [water, setWater] = useState<number>(normalizeWaterScore(todayLog?.water));
  const [memo, setMemo] = useState<string>(todayLog?.memo || '');

  useEffect(() => {
    if (todayLog) {
      setSleep(normalizeSleepScore(todayLog.sleep));
      setFatigue(normalizeFatigueScore(todayLog.fatigue));
      setMood(normalizeMoodScore(todayLog.mood));
      setMeal(normalizeMealScore(todayLog.meal));
      setExercise(normalizeExerciseScore(todayLog.exercise));
      setWater(normalizeWaterScore(todayLog.water));
      setMemo(todayLog.memo);
    }
  }, [todayLog]);

  const handleSave = async () => {
    await addLog({
      date: getTodayDateString(),
      sleep: getScoreLabel('sleep', sleep, '보통') as SleepState,
      fatigue,
      mood,
      stress,
      meal: getScoreLabel('meal', meal, '보통') as MealState,
      exercise: getScoreLabel('exercise', exercise, '안 함') as ExerciseState,
      water: getScoreLabel('water', water, '보통') as WaterState,
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
        <ActivityIndicator size="large" color={atelierColors.deepGreen} />
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
        <ScoreChips selectedValue={sleep} onSelect={setSleep} />
        <View style={styles.scoreHelperRow}>
          <Text style={styles.scoreHelperText}>매우 부족</Text>
          <Text style={styles.scoreHelperText}>매우 좋음</Text>
        </View>

        <SectionTitle title="피로도" />
        <ScoreChips selectedValue={fatigue} onSelect={setFatigue} />
        <View style={styles.scoreHelperRow}>
          <Text style={styles.scoreHelperText}>피곤</Text>
          <Text style={styles.scoreHelperText}>활기참</Text>
        </View>

        <SectionTitle title="기분" />
        <ScoreChips selectedValue={mood} onSelect={setMood} />
        <View style={styles.scoreHelperRow}>
          <Text style={styles.scoreHelperText}>우울</Text>
          <Text style={styles.scoreHelperText}>행복</Text>
        </View>

        <SectionTitle title="스트레스 지수" />
        <ScoreChips selectedValue={stress} onSelect={setStress} />
        <View style={styles.scoreHelperRow}>
          <Text style={styles.scoreHelperText}>높음</Text>
          <Text style={styles.scoreHelperText}>안정적</Text>
        </View>

        <SectionTitle title="식사 상태" />
        <ScoreChips selectedValue={meal} onSelect={setMeal} />
        <View style={styles.scoreHelperRow}>
          <Text style={styles.scoreHelperText}>불규칙</Text>
          <Text style={styles.scoreHelperText}>균형적</Text>
        </View>

        <SectionTitle title="운동 여부" />
        <ScoreChips selectedValue={exercise} onSelect={setExercise} />
        <View style={styles.scoreHelperRow}>
          <Text style={styles.scoreHelperText}>안 함</Text>
          <Text style={styles.scoreHelperText}>충분히</Text>
        </View>

        <SectionTitle title="수분 섭취" />
        <ScoreChips selectedValue={water} onSelect={setWater} />
        <View style={styles.scoreHelperRow}>
          <Text style={styles.scoreHelperText}>부족</Text>
          <Text style={styles.scoreHelperText}>충분</Text>
        </View>

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
  scrollContent: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl + spacing.sm },
  heroCard: {
    ...atelierCards.hero,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl + spacing.xs,
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
  scoreChipWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  scoreChip: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: atelierColors.surface,
    borderWidth: 1,
    borderColor: atelierColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreChipSelected: {
    backgroundColor: atelierColors.deepGreen,
    borderColor: atelierColors.deepGreen,
  },
  scoreChipText: {
    ...atelierText.cardTitleMd,
    fontSize: 16,
    fontWeight: '700',
    color: atelierColors.textMuted,
  },
  scoreChipTextSelected: {
    color: atelierColors.surface,
  },
  scoreHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  scoreHelperText: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.textSoft,
  },
  memoCard: {
    ...atelierCards.section,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    ...atelierText.summary,
    color: atelierColors.surface,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  }
});
