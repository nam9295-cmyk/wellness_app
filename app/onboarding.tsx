import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { DEFAULT_USER_SETTINGS, WELLNESS_GOALS } from '@/types';

export default function Onboarding() {
  const router = useRouter();
  const { updateSettings } = useStore();

  const [nickname, setNickname] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [notificationTime, setNotificationTime] = useState(DEFAULT_USER_SETTINGS.notificationTime);
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
      useMenstrualCycle
    });

    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>웰니스 프로필 설정</Text>
        <Text style={styles.subtitle}>나에게 딱 맞는 웰니스 관리를 시작해볼까요?</Text>
        
        {/* 닉네임 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>어떻게 불러드릴까요?</Text>
          <TextInput
            style={styles.input}
            placeholder="닉네임 (ex: 제인)"
            value={nickname}
            onChangeText={setNickname}
            maxLength={10}
          />
        </View>

        {/* 주요 목표 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱을 사용하는 가장 큰 목적은 무엇인가요?</Text>
          <View style={styles.chipContainer}>
            {WELLNESS_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal}
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
          <Text style={styles.sectionTitle}>매일 기록 알림을 받을까요?</Text>
          <Text style={styles.sectionDesc}>현재는 텍스트 입력만 가능합니다. (ex: 21:00)</Text>
          <TextInput
            style={styles.input}
            placeholder="09:00"
            value={notificationTime}
            onChangeText={setNotificationTime}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* 추가 기능 설정 */}
        <View style={[styles.section, styles.switchSection]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>생리주기 기록 활성화</Text>
            <Text style={styles.sectionDesc}>기록 탭에서 주기를 함께 트래킹합니다.</Text>
          </View>
          <Switch
            value={useMenstrualCycle}
            onValueChange={setUseMenstrualCycle}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>기록 시작하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: 60,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.xs,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: spacing.xl,
    letterSpacing: -0.2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.card,
    fontWeight: 'bold',
  },
  switchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  }
});
