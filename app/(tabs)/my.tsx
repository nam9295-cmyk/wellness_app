import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '@/lib/theme';
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
            />
          ) : (
            <Text style={styles.name}>{userSettings?.nickname || '회원'} 님</Text>
          )}
          <Text style={styles.goalText}>목표: {isEditing ? selectedGoal : userSettings?.goal || '설정 필요'}</Text>
        </View>
        
        <View style={styles.menuList}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>나의 설정 내용</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>수정</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12 }}>
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

              <Text style={[styles.label, { marginTop: 24 }]}>알림 설정 (ex: 21:00)</Text>
              <TextInput
                style={styles.timeInput}
                value={notificationTime}
                onChangeText={setNotificationTime}
                placeholder="시간 입력"
                keyboardType="numbers-and-punctuation"
              />

              <View style={[styles.settingItem, { marginTop: 24, borderWidth: 0, paddingHorizontal: 0, backgroundColor: 'transparent' }]}>
                <Text style={[styles.label, { marginBottom: 0 }]}>생리주기 트래킹</Text>
                <Switch
                  value={useMenstrualCycle}
                  onValueChange={setUseMenstrualCycle}
                  trackColor={{ false: '#E5E7EB', true: colors.primary }}
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
    padding: 32, 
    alignItems: 'center', 
    backgroundColor: '#fff',
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    paddingTop: 48,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: colors.primaryLight, 
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary
  },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  nameInput: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4, borderBottomWidth: 2, borderBottomColor: colors.primary, paddingBottom: 2, minWidth: 100, textAlign: 'center' },
  goalText: { fontSize: 14, color: colors.textLight },
  menuList: { padding: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  editButtonText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  cancelButtonText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  saveButtonText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  settingItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  settingLabel: { fontSize: 15, color: '#4B5563' },
  settingValue: { fontSize: 15, fontWeight: '500', color: colors.primary },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 24 },
  menuItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 8 },
  menuText: { fontSize: 16, color: '#4B5563' },
  
  // Edit Form Styles
  editForm: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F3EFE6' },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  chipTextSelected: { color: colors.primary, fontWeight: 'bold' },
  timeInput: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#E5E7EB', width: 120 }
});
