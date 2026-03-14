import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { ExerciseState, MealState, SleepState, WaterState } from '@/types';
import { useRouter } from 'expo-router';
import { getTodayDateString } from '@/lib/date';
import { MagneticSlider } from '@/components/MagneticSlider';
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

export default function LogScreen() {
  const router = useRouter();
  const { addLog, getTodayLog, isReady } = useStore();
  const todayLog = getTodayLog();
  const isEditingTodayLog = Boolean(todayLog);

  const [sleep, setSleep] = useState<number>(normalizeSleepScore(todayLog?.sleep));
  const [fatigue, setFatigue] = useState<number>(normalizeFatigueScore(todayLog?.fatigue));
  const [mood, setMood] = useState<number>(normalizeMoodScore(todayLog?.mood));
  const [stress, setStress] = useState<number>(normalizeStressScore(todayLog?.stress || undefined));
  const [meal, setMeal] = useState<number>(normalizeMealScore(todayLog?.meal));
  const [exercise, setExercise] = useState<number>(normalizeExerciseScore(todayLog?.exercise));
  const [water, setWater] = useState<number>(normalizeWaterScore(todayLog?.water));
  const [memo, setMemo] = useState<string>(todayLog?.memo || '');
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    if (todayLog) {
      setSleep(normalizeSleepScore(todayLog.sleep));
      setFatigue(normalizeFatigueScore(todayLog.fatigue));
      setMood(normalizeMoodScore(todayLog.mood));
      setStress(normalizeStressScore(todayLog.stress));
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
      '기록이 저장됐고, 오늘의 분석이 업데이트됐어요.',
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TODAY'S JOURNAL</Text>
          <Text style={styles.title}>{isEditingTodayLog ? '오늘 기록 수정' : '오늘 컨디션 남기기'}</Text>
          <Text style={styles.subtitle}>현재 상태를 솔직하게 남겨주세요.</Text>
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>간밤에 잠은 푹 주무셨나요?</Text>
          <MagneticSlider 
            selectedValue={sleep} 
            onSelect={setSleep} 
            leftLabel="설쳤어요" 
            rightLabel="개운해요" 
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
          />
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>지금 신체적인 피로감은 어떤가요?</Text>
          <MagneticSlider 
            selectedValue={fatigue} 
            onSelect={setFatigue} 
            leftLabel="너무 지쳐요" 
            rightLabel="에너지 넘쳐요" 
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
          />
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>오늘 전반적인 기분은 어떠신가요?</Text>
          <MagneticSlider 
            selectedValue={mood} 
            onSelect={setMood} 
            leftLabel="우울해요" 
            rightLabel="아주 좋아요" 
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
          />
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>스트레스를 많이 받으셨나요?</Text>
          <MagneticSlider 
            selectedValue={stress} 
            onSelect={setStress} 
            leftLabel="아주 심해요" 
            rightLabel="평온해요" 
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
          />
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>식사는 규칙적으로 잘 챙겨 드셨나요?</Text>
          <MagneticSlider 
            selectedValue={meal} 
            onSelect={setMeal} 
            leftLabel="불규칙했어요" 
            rightLabel="건강하게 먹었어요" 
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
          />
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>가벼운 산책이나 운동을 하셨나요?</Text>
          <MagneticSlider 
            selectedValue={exercise} 
            onSelect={setExercise} 
            leftLabel="전혀 안 했어요" 
            rightLabel="충분히 했어요" 
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
          />
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>수분 섭취는 충분했나요?</Text>
          <MagneticSlider 
            selectedValue={water} 
            onSelect={setWater} 
            leftLabel="거의 안 마셨어요" 
            rightLabel="충분히 마셨어요" 
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
          />
        </View>

        <View style={[styles.questionSection, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <Text style={styles.questionTitle}>오늘 남기고 싶은 짧은 메모 (선택)</Text>
          <TextInput
            style={styles.memoInput}
            placeholder="특별한 일이나 감정을 편하게 적어주세요."
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={4}
            placeholderTextColor={atelierColors.textSoft}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            activeOpacity={0.9} 
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>{isEditingTodayLog ? '기록 수정하기' : '기록 완료하기'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: atelierColors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 80,
    paddingBottom: spacing.xxl + 40,
  },
  header: {
    marginBottom: spacing.xxl + spacing.md,
  },
  eyebrow: {
    ...atelierText.helper,
    color: atelierColors.deepGreen,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  title: {
    ...atelierText.heroTitle,
    fontSize: 32,
    lineHeight: 42,
    marginBottom: spacing.sm,
    fontWeight: '300',
    letterSpacing: -1,
  },
  subtitle: {
    ...atelierText.bodyMuted,
    fontSize: 16,
    lineHeight: 26,
    color: atelierColors.textMuted,
  },
  
  questionSection: {
    marginBottom: spacing.xxl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: atelierColors.border,
  },
  questionTitle: {
    ...atelierText.cardTitleMd,
    fontSize: 18,
    fontWeight: '400',
    color: atelierColors.title,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },

  /* Memo */
  memoInput: {
    backgroundColor: atelierColors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    paddingTop: spacing.lg,
    fontSize: 16,
    color: atelierColors.text,
    borderWidth: 1,
    borderColor: atelierColors.border,
    minHeight: 120,
    lineHeight: 24,
  },

  /* Footer */
  footer: {
    marginTop: spacing.xxl,
  },
  saveButton: {
    backgroundColor: atelierColors.deepGreen,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: atelierColors.deepGreen,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 15,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});