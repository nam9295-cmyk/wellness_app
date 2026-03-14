import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { atelierColors, atelierText } from '@/lib/atelierTheme';
import { getNotificationScenarioPreviews } from '@/lib/notificationScenarios';
import { SavedBlendItem } from '@/lib/teaBoxStorage';
import { spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { DEFAULT_USER_SETTINGS, WELLNESS_GOALS } from '@/types';
import { formatDisplayDate } from '@/lib/date';

export default function MyScreen() {
  const {
    isReady,
    userSettings,
    updateSettings,
    savedBlendItems,
    removeSavedBlendFromBox,
    syncStatus,
    syncStatusMessage,
    clearSyncStatusMessage,
  } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(userSettings?.nickname || '');
  const [selectedGoal, setSelectedGoal] = useState(userSettings?.goal || DEFAULT_USER_SETTINGS.goal);
  const [notificationTime, setNotificationTime] = useState(userSettings?.notificationTime || DEFAULT_USER_SETTINGS.notificationTime);
  const [notificationEnabled, setNotificationEnabled] = useState(userSettings?.notificationEnabled || DEFAULT_USER_SETTINGS.notificationEnabled);
  const [useMenstrualCycle, setUseMenstrualCycle] = useState(userSettings?.useMenstrualCycle || DEFAULT_USER_SETTINGS.useMenstrualCycle);

  const syncFormWithSettings = () => {
    setNickname(userSettings?.nickname || '');
    setSelectedGoal(userSettings?.goal || DEFAULT_USER_SETTINGS.goal);
    setNotificationTime(userSettings?.notificationTime || DEFAULT_USER_SETTINGS.notificationTime);
    setNotificationEnabled(userSettings?.notificationEnabled || DEFAULT_USER_SETTINGS.notificationEnabled);
    setUseMenstrualCycle(userSettings?.useMenstrualCycle || DEFAULT_USER_SETTINGS.useMenstrualCycle);
  };

  useEffect(() => {
    if (!isEditing && userSettings) {
      syncFormWithSettings();
    }
  }, [isEditing, userSettings]);

  useEffect(() => {
    if (!syncStatusMessage || syncStatus === 'syncing') {
      return;
    }

    const timer = setTimeout(() => {
      clearSyncStatusMessage();
    }, 4000);

    return () => clearTimeout(timer);
  }, [syncStatus, syncStatusMessage, clearSyncStatusMessage]);

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
      goal: selectedGoal as (typeof WELLNESS_GOALS)[number],
      notificationTime,
      notificationEnabled,
      useMenstrualCycle
    });
    
    setIsEditing(false);
    Alert.alert('저장 완료', '설정이 업데이트되었습니다.');
  };

  const handleStartEditing = () => {
    syncFormWithSettings();
    setIsEditing(true);
  };

  const handleCancel = () => {
    syncFormWithSettings();
    setIsEditing(false);
  };

  const handleRemoveBlend = (item: SavedBlendItem) => {
    const itemName = item.type === 'preset' ? item.name : item.title;

    Alert.alert(
      '블렌드함에서 삭제',
      `${itemName}을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await removeSavedBlendFromBox(item.id);
          },
        },
      ]
    );
  };

  const notificationPreviews = getNotificationScenarioPreviews(userSettings);
  const cwaterBlendItems = savedBlendItems.filter((item) => item.type === 'cwater');
  const hiddenLegacyBlendCount = savedBlendItems.length - cwaterBlendItems.length;

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={atelierColors.deepGreen} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Text style={styles.eyebrow}>MY PROFILE</Text>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임"
                maxLength={10}
                placeholderTextColor={atelierColors.textSoft}
              />
            ) : (
              <Text style={styles.title}>{userSettings?.nickname || '회원'}님</Text>
            )}
            <Text style={styles.subtitle}>
              {isEditing ? '나에게 맞는 웰니스 목표를 선택해주세요.' : `현재 목표: ${userSettings?.goal || '설정 필요'}`}
            </Text>
          </View>
          {!isEditing && (
            <TouchableOpacity onPress={handleStartEditing} style={styles.editButton}>
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
          )}
        </View>

        {syncStatusMessage ? (
          <View style={[styles.syncBanner, syncStatus === 'fallback' && styles.syncBannerFallback]}>
            <Text style={[styles.syncText, syncStatus === 'fallback' && styles.syncTextFallback]}>
              {syncStatusMessage}
            </Text>
          </View>
        ) : null}

        {isEditing ? (
          <View style={styles.editSection}>
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

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>저장하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* App Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>앱 설정</Text>
              
              <View style={styles.settingsGroup}>
                <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: atelierColors.border }]}>
                  <View style={styles.settingTextWrap}>
                    <Text style={styles.settingLabel}>알림 수신</Text>
                    <Text style={styles.settingDesc}>기록과 추천 알림을 보내드려요.</Text>
                  </View>
                  <Switch
                    value={notificationEnabled}
                    onValueChange={async (val) => {
                      setNotificationEnabled(val);
                      await updateSettings({ notificationEnabled: val });
                    }}
                    trackColor={{ false: atelierColors.border, true: atelierColors.deepGreen }}
                    ios_backgroundColor={atelierColors.surfaceMuted}
                  />
                </View>

                {notificationEnabled && (
                  <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: atelierColors.border }]}>
                    <View style={styles.settingTextWrap}>
                      <Text style={styles.settingLabel}>알림 시간</Text>
                      <Text style={styles.settingDesc}>원하는 시간에 알려드릴게요.</Text>
                    </View>
                    <TextInput
                      style={styles.timeInput}
                      value={notificationTime}
                      onChangeText={setNotificationTime}
                      onEndEditing={async () => await updateSettings({ notificationTime })}
                      placeholder="09:00"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                )}

                <View style={styles.settingRow}>
                  <View style={styles.settingTextWrap}>
                    <Text style={styles.settingLabel}>여성 건강 주기 연동</Text>
                    <Text style={styles.settingDesc}>주기에 맞춘 컨디션 분석을 제공합니다.</Text>
                  </View>
                  <Switch
                    value={useMenstrualCycle}
                    onValueChange={async (val) => {
                      setUseMenstrualCycle(val);
                      await updateSettings({ useMenstrualCycle: val });
                    }}
                    trackColor={{ false: atelierColors.border, true: atelierColors.deepGreen }}
                    ios_backgroundColor={atelierColors.surfaceMuted}
                  />
                </View>
              </View>
            </View>

            {/* Notification Preview */}
            {notificationEnabled && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>이런 알림이 도착할 수 있어요</Text>
                <View style={styles.previewContainer}>
                  {notificationPreviews.map((preview, index) => (
                    <View key={index} style={styles.previewCard}>
                      <Text style={styles.previewTitle}>{preview.title}</Text>
                      <Text style={styles.previewBody}>{preview.body}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Saved Blends */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>나만의 블렌드 보관함</Text>
              {cwaterBlendItems.length > 0 ? (
                <View style={styles.blendList}>
                  {cwaterBlendItems.map((item) => (
                    <View key={item.id} style={styles.blendCard}>
                      <View style={styles.blendInfo}>
                        <Text style={styles.blendName}>{item.title}</Text>
                        <Text style={styles.blendDate}>{formatDisplayDate(item.savedAt)} 저장됨</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleRemoveBlend(item)}
                      >
                        <Text style={styles.deleteButtonText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>아직 보관된 블렌드가 없어요.</Text>
                </View>
              )}
            </View>

            {/* 개발/디버그용: 구버전 데이터가 있다면 표시 */}
            {hiddenLegacyBlendCount > 0 && (
              <Text style={styles.legacyDataNotice}>
                (구버전 데이터 {hiddenLegacyBlendCount}개가 숨겨져 있습니다.)
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: atelierColors.background,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 80,
    paddingBottom: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  profileInfo: {
    flex: 1,
    paddingRight: spacing.lg,
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
    marginBottom: spacing.xs,
    fontWeight: '300',
    letterSpacing: -1,
  },
  subtitle: {
    ...atelierText.bodyMuted,
    fontSize: 16,
    color: atelierColors.textMuted,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: atelierColors.surfaceMuted,
    borderWidth: 1,
    borderColor: atelierColors.border,
    marginTop: 4,
  },
  editButtonText: {
    ...atelierText.helper,
    color: atelierColors.text,
    fontWeight: '600',
  },
  
  /* Edit Mode Styles */
  nameInput: {
    ...atelierText.heroTitle,
    fontSize: 32,
    lineHeight: 42,
    marginBottom: spacing.xs,
    fontWeight: '300',
    letterSpacing: -1,
    color: atelierColors.title,
    borderBottomWidth: 1,
    borderBottomColor: atelierColors.borderStrong,
    paddingBottom: 4,
    minWidth: '80%',
  },
  editSection: {
    marginTop: spacing.xl,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.xxl,
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: atelierColors.surfaceMuted,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  cancelButtonText: {
    ...atelierText.body,
    fontWeight: '600',
    color: atelierColors.text,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: atelierColors.deepGreen,
    alignItems: 'center',
  },
  saveButtonText: {
    ...atelierText.body,
    fontWeight: '600',
    color: '#FFF',
  },

  /* Sections */
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...atelierText.cardTitleMd,
    fontSize: 18,
    color: atelierColors.title,
    marginBottom: spacing.lg,
  },
  
  /* Settings Group */
  settingsGroup: {
    backgroundColor: atelierColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: atelierColors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  settingTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  settingLabel: {
    ...atelierText.cardTitleMd,
    fontSize: 16,
    color: atelierColors.title,
    marginBottom: 4,
  },
  settingDesc: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
  },
  timeInput: {
    ...atelierText.body,
    backgroundColor: atelierColors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: atelierColors.border,
    textAlign: 'center',
    minWidth: 80,
  },

  /* Previews */
  previewContainer: {
    gap: spacing.sm,
  },
  previewCard: {
    backgroundColor: atelierColors.surfaceMuted,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  previewTitle: {
    ...atelierText.helper,
    fontWeight: '600',
    color: atelierColors.deepGreen,
    marginBottom: 6,
  },
  previewBody: {
    ...atelierText.bodyMuted,
    fontSize: 14,
    lineHeight: 22,
    color: atelierColors.text,
  },

  /* Blends */
  blendList: {
    gap: spacing.md,
  },
  blendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: atelierColors.surface,
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  blendInfo: {
    flex: 1,
  },
  blendName: {
    ...atelierText.cardTitleMd,
    fontSize: 16,
    marginBottom: 4,
  },
  blendDate: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    ...atelierText.helper,
    color: atelierColors.dustyRose,
    fontWeight: '600',
  },
  
  /* Empty State */
  emptyCard: {
    backgroundColor: atelierColors.surfaceMuted,
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: atelierColors.border,
    alignItems: 'center',
  },
  emptyText: {
    ...atelierText.bodyMuted,
    color: atelierColors.textSoft,
  },

  /* Banners */
  syncBanner: {
    backgroundColor: atelierColors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: atelierColors.deepGreen,
    marginBottom: spacing.xl,
  },
  syncBannerFallback: {
    borderLeftColor: atelierColors.textSoft,
  },
  syncText: {
    ...atelierText.bodyMuted,
    color: atelierColors.text,
  },
  syncTextFallback: {
    color: atelierColors.textSoft,
  },
  legacyDataNotice: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});