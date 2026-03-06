import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { TeaRecommendationDetailModal } from '@/components/TeaRecommendationDetailModal';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { TeaRecommendationId, teaRecommendationContent } from '@/lib/teaRecommendationContent';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { TeaRecommendationResult } from '@/lib/teaRecommendationEngine';
import { DEFAULT_USER_SETTINGS, WELLNESS_GOALS } from '@/types';

export default function MyScreen() {
  const { isReady, userSettings, updateSettings, savedTeaIds, removeTeaFromBox } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTeaId, setSelectedTeaId] = useState<TeaRecommendationId | null>(null);
  const [nickname, setNickname] = useState(userSettings?.nickname || '');
  const [selectedGoal, setSelectedGoal] = useState(userSettings?.goal || DEFAULT_USER_SETTINGS.goal);
  const [notificationTime, setNotificationTime] = useState(userSettings?.notificationTime || DEFAULT_USER_SETTINGS.notificationTime);
  const [useMenstrualCycle, setUseMenstrualCycle] = useState(userSettings?.useMenstrualCycle || DEFAULT_USER_SETTINGS.useMenstrualCycle);

  const syncFormWithSettings = () => {
    setNickname(userSettings?.nickname || '');
    setSelectedGoal(userSettings?.goal || DEFAULT_USER_SETTINGS.goal);
    setNotificationTime(userSettings?.notificationTime || DEFAULT_USER_SETTINGS.notificationTime);
    setUseMenstrualCycle(userSettings?.useMenstrualCycle || DEFAULT_USER_SETTINGS.useMenstrualCycle);
  };

  useEffect(() => {
    if (!isEditing && userSettings) {
      syncFormWithSettings();
    }
  }, [isEditing, userSettings]);

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    if (!selectedGoal) {
      Alert.alert('알림', '목표를 선택해주세요.');
      return;
    }

    await updateSettings({
      nickname: nickname.trim(),
      goal: selectedGoal,
      notificationTime,
      useMenstrualCycle
    });
    
    setIsEditing(false);
    Alert.alert('성공', '설정이 저장되었습니다.');
  };

  const handleStartEditing = () => {
    syncFormWithSettings();
    setIsEditing(true);
  };

  const handleCancel = () => {
    syncFormWithSettings();
    setIsEditing(false);
  };

  const handleRemoveTea = (teaId: TeaRecommendationId) => {
    const tea = teaRecommendationContent[teaId];

    Alert.alert(
      '내 티함에서 삭제',
      `${tea.name}을(를) 내 티함에서 뺄까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await removeTeaFromBox(teaId);

            if (selectedTeaId === teaId) {
              setSelectedTeaId(null);
            }
          },
        },
      ]
    );
  };

  const selectedTeaRecommendation: TeaRecommendationResult | null = selectedTeaId
    ? {
        teaId: selectedTeaId,
        content: teaRecommendationContent[selectedTeaId],
        reason: '다시 보고 싶은 블렌드를 내 티함에 담아두었어요. 지금의 취향과 무드에 맞는지 천천히 살펴볼 수 있어요.',
        contextLine: `저장한 블렌드 · ${teaRecommendationContent[selectedTeaId].timings[0]}`,
      }
    : null;

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
              <TouchableOpacity onPress={handleStartEditing}>
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
                {WELLNESS_GOALS.map((g) => (
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
                <Text style={styles.settingLabel}>주요 목표</Text>
                <Text style={styles.settingValue}>{userSettings?.goal || '설정 안 함'}</Text>
              </View>

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

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 티함</Text>
            <Text style={styles.sectionMeta}>{savedTeaIds.length}개 담겨 있어요</Text>
          </View>

          {savedTeaIds.length > 0 ? (
            <View>
              {savedTeaIds.map((teaId) => {
                const tea = teaRecommendationContent[teaId];

                return (
                  <View key={teaId} style={styles.teaItem}>
                    <TouchableOpacity style={styles.teaItemMain} activeOpacity={0.88} onPress={() => setSelectedTeaId(teaId)}>
                      <TeaThumbnail teaId={teaId} size="sm" />
                      <View style={styles.teaItemText}>
                        <Text style={styles.teaItemBadge}>담아둔 블렌드</Text>
                        <Text style={styles.teaName}>{tea.name}</Text>
                        <Text style={styles.teaSubtitle}>{tea.subtitle}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleRemoveTea(teaId)} style={styles.removeButton}>
                      <Text style={styles.removeButtonText}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyTeaBox}>
              <Text style={styles.emptyTeaText}>마음에 드는 추천 티를 담아두면, 여기서 다시 꺼내 보며 비교할 수 있어요.</Text>
            </View>
          )}

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>앱 정보 (v1.0.0)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {selectedTeaRecommendation ? (
        <TeaRecommendationDetailModal
          visible={Boolean(selectedTeaRecommendation)}
          recommendation={selectedTeaRecommendation}
          reasonTitle="저장해둔 블렌드"
          onClose={() => setSelectedTeaId(null)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
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
  sectionMeta: { fontSize: 13, color: colors.textLight, fontWeight: '600', letterSpacing: -0.2 },
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
  teaItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  teaItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  teaItemText: {
    gap: 4,
  },
  teaItemBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  teaName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  teaSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    letterSpacing: -0.2,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    alignSelf: 'stretch',
  },
  removeButtonText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  emptyTeaBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  emptyTeaText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textLight,
    letterSpacing: -0.2,
  },
  
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
