import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';
import { useStore } from '@/lib/store';

const GOALS = ['피로 관리', '수면 관리', '식습관 관리', '운동 루틴 유지', '기분 관리'];

export default function Onboarding() {
  const router = useRouter();
  const { updateSettings } = useStore();

  const [nickname, setNickname] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [useMenstrualCycle, setUseMenstrualCycle] = useState(false);

  const handleStart = () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    if (!selectedGoal) {
      Alert.alert('알림', '주요 목표를 선택해주세요.');
      return;
    }

    updateSettings({
      nickname: nickname.trim(),
      goal: selectedGoal,
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
            {GOALS.map((goal) => (
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
            trackColor={{ false: '#E5E7EB', true: colors.primary }}
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  switchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
