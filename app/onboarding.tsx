import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { DEFAULT_USER_SETTINGS, WELLNESS_GOALS } from '@/types';

export default function Onboarding() {
  const router = useRouter();
  const { updateSettings } = useStore();

  const [nickname, setNickname] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [notificationTime, setNotificationTime] = useState(DEFAULT_USER_SETTINGS.notificationTime);
  const [notificationEnabled, setNotificationEnabled] = useState(DEFAULT_USER_SETTINGS.notificationEnabled);
  const [useMenstrualCycle, setUseMenstrualCycle] = useState(DEFAULT_USER_SETTINGS.useMenstrualCycle);

  const handleStart = async () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    if (!selectedGoal) {
      Alert.alert('알림', '주요 목표를 선택해주세요.');
      return;
    }

    await updateSettings({
      nickname: nickname.trim(),
      goal: selectedGoal as (typeof WELLNESS_GOALS)[number],
      notificationTime,
      notificationEnabled,
      useMenstrualCycle
    });

    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: atelierColors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>GET STARTED</Text>
          <Text style={styles.title}>나만의 웰니스 설정</Text>
          <Text style={styles.subtitle}>기록과 추천이 잘 맞도록{'\n'}기본 설정을 먼저 맞춰볼게요.</Text>
        </View>
        
        {/* 닉네임 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>어떻게 불러드릴까요?</Text>
          <TextInput
            style={styles.input}
            placeholder="닉네임 (ex: 제인)"
            value={nickname}
            onChangeText={setNickname}
            maxLength={10}
            placeholderTextColor={atelierColors.textSoft}
          />
        </View>

        {/* 주요 목표 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>가장 중요한 목표는 무엇인가요?</Text>
          <View style={styles.chipContainer}>
            {WELLNESS_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  selectedGoal === goal && styles.chipSelected
                ]}
                onPress={() => setSelectedGoal(goal)}
              >
                <Text style={[
                  styles.chipText,
                  selectedGoal === goal && styles.chipTextSelected
                ]}>{goal}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 알림 시간 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 시간을 정해둘까요?</Text>
          <Text style={styles.sectionDesc}>원하는 시간을 미리 정해둘 수 있어요.</Text>
          <TextInput
            style={styles.input}
            placeholder="09:00"
            value={notificationTime}
            onChangeText={setNotificationTime}
            keyboardType="numbers-and-punctuation"
            placeholderTextColor={atelierColors.textSoft}
          />
        </View>

        <View style={[styles.section, styles.switchRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitleInline}>알림 서비스 준비</Text>
            <Text style={styles.sectionDesc}>기록 시간을 잊지 않게 도와드려요.</Text>
          </View>
          <Switch
            value={notificationEnabled}
            onValueChange={setNotificationEnabled}
            trackColor={{ false: atelierColors.border, true: atelierColors.deepGreen }}
            ios_backgroundColor={atelierColors.border}
          />
        </View>

        {/* 추가 기능 설정 */}
        <View style={[styles.section, styles.switchRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitleInline}>바이오리듬 연동</Text>
            <Text style={styles.sectionDesc}>여성 건강 주기와 컨디션을 함께 살펴봅니다.</Text>
          </View>
          <Switch
            value={useMenstrualCycle}
            onValueChange={setUseMenstrualCycle}
            trackColor={{ false: atelierColors.border, true: atelierColors.deepGreen }}
            ios_backgroundColor={atelierColors.border}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleStart}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>기록 시작하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: 80,
    backgroundColor: atelierColors.background,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.xxl,
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
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...atelierText.cardTitleMd,
    fontSize: 18,
    fontWeight: '500',
    color: atelierColors.title,
    marginBottom: spacing.md,
    letterSpacing: -0.4,
  },
  sectionTitleInline: {
    ...atelierText.cardTitleMd,
    fontSize: 17,
    fontWeight: '500',
    color: atelierColors.title,
    marginBottom: 4,
  },
  sectionDesc: {
    ...atelierText.bodyMuted,
    fontSize: 14,
    color: atelierColors.textSoft,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: atelierColors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    fontSize: 16,
    color: atelierColors.text,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: atelierColors.surface,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  chipSelected: {
    backgroundColor: atelierColors.deepGreen,
    borderColor: atelierColors.deepGreen,
  },
  chipText: {
    ...atelierText.body,
    fontSize: 14,
    color: atelierColors.textMuted,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: atelierColors.surface,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  button: {
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  }
});
