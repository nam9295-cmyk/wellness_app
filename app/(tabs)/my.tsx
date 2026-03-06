import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';

const GOALS = ['피로 관리', '수면 관리', '식습관 관리', '운동 루틴 유지', '기분 관리'];

export default function MyScreen() {
  const { userSettings, updateSettings } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(userSettings?.nickname || '');
  const [selectedGoal, setSelectedGoal] = useState(userSettings?.goal || '');
  const [notificationTime, setNotificationTime] = useState(userSettings?.notificationTime || '');
  const [useMenstrualCycle, setUseMenstrualCycle] = useState(userSettings?.useMenstrualCycle || false);

  useEffect(() => {
    if (!isEditing && userSettings) {
      setNickname(userSettings.nickname);
      setSelectedGoal(userSettings.goal);
      setNotificationTime(userSettings.notificationTime);
      setUseMenstrualCycle(userSettings.useMenstrualCycle);
    }
  }, [isEditing, userSettings]);

  const handleSave = () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    if (!selectedGoal) {
      Alert.alert('알림', '목표를 선택해주세요.');
      return;
    }

    updateSettings({
      nickname: nickname.trim(),
      goal: selectedGoal,
      notificationTime,
      useMenstrualCycle
    });
    
    setIsEditing(false);
    Alert.alert('성공', '설정이 저장되었습니다.');
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{isEditing ? nickname?.[0] || '?' : userSettings?.nickname?.[0] || '?'}</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임"
              maxLength={10}
              placeholderTextColor={colors.textLight}
            />
          ) : (
            <Text style={styles.name}>{userSettings?.nickname || '회원'} 님</Text>
          )}
          <Text style={styles.goalText}>목표: {isEditing ? selectedGoal : userSettings?.goal || '설정 필요'}</Text>
        </View>
        
        <View style={styles.menuList}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>나의 설정</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>수정</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave}>
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.label}>주요 목표</Text>
              <View style={styles.chipContainer}>
                {GOALS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, selectedGoal === g && styles.chipSelected]}
                    onPress={() => setSelectedGoal(g)}
                  >
                    <Text style={[styles.chipText, selectedGoal === g && styles.chipTextSelected]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: spacing.xl }]}>알림 설정 (ex: 21:00)</Text>
              <TextInput
                style={styles.timeInput}
                value={notificationTime}
                onChangeText={setNotificationTime}
                placeholder="시간 입력"
                keyboardType="numbers-and-punctuation"
                placeholderTextColor={colors.textLight}
              />

              <View style={[styles.settingItem, { marginTop: spacing.xl, borderWidth: 0, paddingHorizontal: 0, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]}>
                <Text style={[styles.label, { marginBottom: 0 }]}>생리주기 트래킹</Text>
                <Switch
                  value={useMenstrualCycle}
                  onValueChange={setUseMenstrualCycle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>알림 시간</Text>
                <Text style={styles.settingValue}>{userSettings?.notificationTime || '설정 안 함'}</Text>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>생리주기 트래킹</Text>
                <Text style={styles.settingValue}>{userSettings?.useMenstrualCycle ? '사용 중' : '사용 안 함'}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>앱 정보 (v1.0.0)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileSection: { 
    padding: spacing.xl, 
    alignItems: 'center', 
    backgroundColor: colors.card,
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(0,0,0,0.02)',
    paddingTop: spacing.xxl,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#F3F4F6', 
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text
  },
  name: { fontSize: 24, fontWeight: '600', color: colors.text, marginBottom: 4, letterSpacing: -0.5 },
  nameInput: { fontSize: 24, fontWeight: '600', color: colors.text, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.primary, paddingBottom: 4, minWidth: 120, textAlign: 'center', letterSpacing: -0.5 },
  goalText: { fontSize: 15, color: colors.textLight, letterSpacing: -0.2 },
  menuList: { padding: spacing.lg, paddingTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, letterSpacing: -0.3 },
  editButtonText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  cancelButtonText: { fontSize: 15, color: colors.textLight, fontWeight: '600' },
  saveButtonText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  settingItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  settingLabel: { fontSize: 15, color: colors.text, fontWeight: '500', letterSpacing: -0.2 },
  settingValue: { fontSize: 15, fontWeight: '500', color: colors.textLight },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },
  menuItem: { paddingVertical: spacing.md, backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  menuText: { fontSize: 15, color: colors.text, fontWeight: '500', letterSpacing: -0.2 },
  
  // Edit Form Styles
  editForm: { backgroundColor: colors.card, padding: spacing.lg, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.md, letterSpacing: -0.2 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontSize: 14, color: colors.textLight, fontWeight: '500' },
  chipTextSelected: { color: colors.background, fontWeight: '600' },
  timeInput: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, fontSize: 15, borderWidth: 1, borderColor: colors.border, width: 140, color: colors.text }
});
