import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { atelierButtons, atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { getNotificationScenarioPreviews } from '@/lib/notificationScenarios';
import { SavedBlendItem } from '@/lib/teaBoxStorage';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { DEFAULT_USER_SETTINGS, WELLNESS_GOALS } from '@/types';

export default function MyScreen() {
  const {
    isReady,
    userSettings,
    updateSettings,
    savedBlendItems,
    savedTeaIds,
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
      goal: selectedGoal,
      notificationTime,
      notificationEnabled,
      useMenstrualCycle
    });
    
    setIsEditing(false);
    Alert.alert('저장 완료', '설정이 저장됐어요.');
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
      `${itemName}을(를) 블렌드함에서 뺄까요?`,
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
              placeholderTextColor={atelierColors.textSoft}
            />
          ) : (
            <Text style={styles.name}>{userSettings?.nickname || '회원'} 님</Text>
          )}
          <Text style={styles.goalText}>현재 목표 · {isEditing ? selectedGoal : userSettings?.goal || '설정 필요'}</Text>
        </View>
        
        <View style={styles.menuList}>
          {syncStatusMessage ? (
            <View style={[styles.syncBanner, syncStatus === 'fallback' && styles.syncBannerFallback]}>
              <Text style={[styles.syncText, syncStatus === 'fallback' && styles.syncTextFallback]}>
                {syncStatusMessage}
              </Text>
            </View>
          ) : null}

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

              <Text style={[styles.label, { marginTop: spacing.xl }]}>알림 시간</Text>
              <TextInput
                style={styles.timeInput}
                value={notificationTime}
                onChangeText={setNotificationTime}
                placeholder="예: 21:00"
                keyboardType="numbers-and-punctuation"
                placeholderTextColor={atelierColors.textSoft}
              />

              <View style={[styles.settingItem, styles.inlineSettingItem]}>
                <Text style={[styles.label, { marginBottom: 0 }]}>알림 준비</Text>
                <Switch
                  value={notificationEnabled}
                  onValueChange={setNotificationEnabled}
                  trackColor={{ false: atelierColors.border, true: atelierColors.deepGreenSoft }}
                />
              </View>

              <View style={[styles.settingItem, styles.inlineSettingItem]}>
                <Text style={[styles.label, { marginBottom: 0 }]}>바이오리듬 트래킹</Text>
                <Switch
                  value={useMenstrualCycle}
                  onValueChange={setUseMenstrualCycle}
                  trackColor={{ false: atelierColors.border, true: atelierColors.deepGreenSoft }}
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
                <Text style={styles.settingLabel}>알림 준비</Text>
                <Text style={styles.settingValue}>{userSettings?.notificationEnabled ? '준비됨' : '준비 중'}</Text>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>바이오리듬 트래킹</Text>
                <Text style={styles.settingValue}>{userSettings?.useMenstrualCycle ? '사용 중' : '사용 안 함'}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>알림 준비</Text>
            <Text style={styles.sectionMeta}>{userSettings?.notificationEnabled ? '시나리오 연결됨' : '시나리오 준비 중'}</Text>
          </View>

          <View style={styles.notificationCard}>
            <Text style={styles.notificationIntro}>
              실제 발송 전이지만, 아래 흐름으로 바로 확장할 수 있어요.
            </Text>

            {notificationPreviews.map((scenario, index) => (
              <View
                key={scenario.id}
                style={[styles.notificationItem, index === 0 && styles.notificationItemFirst]}
              >
                <View style={styles.notificationItemHeader}>
                  <Text style={styles.notificationTitle}>{scenario.title}</Text>
                  <Text style={[styles.notificationStatus, scenario.enabled && styles.notificationStatusReady]}>
                    {scenario.statusLabel}
                  </Text>
                </View>
                <Text style={styles.notificationDesc}>{scenario.description}</Text>
                <Text style={styles.notificationMeta}>{scenario.scheduleLabel}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>블렌드함</Text>
            <Text style={styles.sectionMeta}>{cwaterBlendItems.length}개 저장됨</Text>
          </View>

          {hiddenLegacyBlendCount > 0 ? (
            <View style={styles.archivedBlendNote}>
              <Text style={styles.archivedBlendNoteText}>
                이전 저장 조합 {hiddenLegacyBlendCount}개는 내부 호환용으로 유지되고 있어요.
              </Text>
            </View>
          ) : null}

          {cwaterBlendItems.length > 0 ? (
            <View>
              {cwaterBlendItems.map((item) => {
                const cacaoLabel =
                  typeof item.cacaoNibLevel === 'number' ? `카카오 ${item.cacaoNibLevel}` : '카카오 0';

                return (
                  <View key={item.id} style={styles.teaItem}>
                    <View style={styles.teaItemMain}>
                      <View style={[styles.customBlendBadge, item.type === 'cwater' && styles.cwaterBlendBadge]}>
                        <Text style={[styles.customBlendBadgeText, item.type === 'cwater' && styles.cwaterBlendBadgeText]}>
                          {item.type === 'cwater' ? 'CW' : 'AI'}
                        </Text>
                      </View>
                      <View style={styles.teaItemText}>
                        <View style={styles.teaItemMetaRow}>
                          <Text style={styles.teaItemBadge}>{item.toneLabel}</Text>
                          <View style={styles.cacaoLevelPill}>
                            <Text style={styles.cacaoLevelPillText}>{cacaoLabel}</Text>
                          </View>
                        </View>
                        <Text style={styles.teaName}>{item.displayName || item.title}</Text>
                        <Text style={styles.teaSubtitle} numberOfLines={2}>
                          {item.summary || item.shortDescription}
                        </Text>
                        <View style={styles.savedTagRow}>
                          {(item.tags || []).slice(0, 3).map((tag) => (
                            <View key={tag} style={styles.savedTagChip}>
                              <Text style={styles.savedTagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.teaItemMeta} numberOfLines={1}>
                          {item.ingredientNames.join(' · ')}
                        </Text>
                        <Text style={styles.customBlendContext}>{item.contextLine}</Text>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => handleRemoveBlend(item)} style={styles.removeButton}>
                      <Text style={styles.removeButtonText}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyTeaBox}>
              <Text style={styles.emptyTeaText}>아직 담아둔 C.Water 블렌드가 없어요. 홈에서 추천 조합을 담아두면 여기서 다시 볼 수 있어요.</Text>
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
  container: { flex: 1, backgroundColor: atelierColors.background },
  content: { paddingBottom: spacing.xxl + spacing.sm },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  profileSection: { 
    ...atelierCards.hero,
    padding: spacing.xl,
    alignItems: 'center', 
    paddingTop: spacing.xxl + spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: atelierColors.deepGreenMuted, 
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: atelierColors.deepGreen
  },
  name: { ...atelierText.heroTitle, fontSize: 24, lineHeight: 30, marginBottom: 4 },
  nameInput: {
    ...atelierText.heroTitle,
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: atelierColors.deepGreenSoft,
    paddingBottom: 4,
    minWidth: 120,
    textAlign: 'center',
  },
  goalText: { ...atelierText.bodyMuted, fontSize: 15, lineHeight: 23 },
  menuList: { padding: spacing.lg, paddingTop: spacing.xl + spacing.xs },
  syncBanner: {
    backgroundColor: atelierColors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  syncBannerFallback: {
    backgroundColor: atelierColors.deepGreenMuted,
    borderColor: atelierColors.deepGreenSoft,
  },
  syncText: {
    ...atelierText.bodyMuted,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  syncTextFallback: {
    color: atelierColors.text,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { ...atelierText.cardTitleMd },
  sectionMeta: { ...atelierText.helper, fontSize: 13, color: atelierColors.textSoft, fontWeight: '600', letterSpacing: -0.2 },
  editButtonText: { ...atelierButtons.inlineText, color: atelierColors.deepGreen },
  cancelButtonText: { ...atelierButtons.inlineText, color: atelierColors.textSoft },
  saveButtonText: { ...atelierButtons.inlineText, color: atelierColors.deepGreen },
  settingItem: { 
    ...atelierCards.section,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 20,
  },
  inlineSettingItem: {
    marginTop: spacing.xl,
    borderWidth: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  settingLabel: { ...atelierText.body, fontSize: 15, fontWeight: '500' },
  settingValue: { ...atelierText.bodyMuted, fontSize: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: atelierColors.border, marginVertical: spacing.xl + spacing.xs },
  menuItem: { ...atelierCards.section, paddingVertical: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: 20 },
  menuText: { ...atelierText.body, fontSize: 15, fontWeight: '500' },
  notificationCard: {
    ...atelierCards.section,
    padding: spacing.xl,
    borderRadius: 24,
  },
  notificationIntro: {
    ...atelierText.bodyMuted,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  notificationItem: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: atelierColors.border,
  },
  notificationItemFirst: {
    paddingTop: 0,
    borderTopWidth: 0,
  },
  notificationItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationTitle: {
    flex: 1,
    ...atelierText.body,
    fontSize: 15,
    fontWeight: '600',
  },
  notificationStatus: {
    ...atelierText.helper,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  notificationStatusReady: {
    color: atelierColors.deepGreen,
  },
  notificationDesc: {
    marginTop: spacing.xs,
    ...atelierText.bodyMuted,
    lineHeight: 22,
  },
  notificationMeta: {
    marginTop: spacing.xs,
    ...atelierText.helper,
    fontSize: 12,
    fontWeight: '600',
    color: atelierColors.text,
    letterSpacing: -0.1,
  },
  archivedBlendNote: {
    ...atelierCards.meta,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  archivedBlendNoteText: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  teaItem: {
    ...atelierCards.section,
    borderRadius: 20,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  teaItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  teaItemText: {
    flex: 1,
    gap: 4,
  },
  teaItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 2,
  },
  teaItemBadge: {
    ...atelierText.pill,
    fontSize: 12,
    color: atelierColors.deepGreen,
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  cacaoLevelPill: {
    backgroundColor: atelierColors.deepGreenMuted,
    borderWidth: 1,
    borderColor: atelierColors.deepGreenSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cacaoLevelPillText: {
    ...atelierText.pill,
    color: atelierColors.deepGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  customBlendBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: atelierColors.deepGreenMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cwaterBlendBadge: {
    backgroundColor: atelierColors.surfaceMuted,
    borderWidth: 1,
    borderColor: atelierColors.deepGreenSoft,
  },
  customBlendBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: atelierColors.deepGreen,
    letterSpacing: -0.1,
  },
  cwaterBlendBadgeText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  teaName: {
    ...atelierText.cardTitleMd,
    fontSize: 16,
  },
  teaSubtitle: {
    ...atelierText.bodyMuted,
  },
  savedTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  savedTagChip: {
    backgroundColor: atelierColors.surfaceMuted,
    borderWidth: 1,
    borderColor: atelierColors.border,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  savedTagText: {
    ...atelierText.pill,
    color: atelierColors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  teaItemMeta: {
    ...atelierText.helper,
    color: atelierColors.deepGreen,
    letterSpacing: -0.1,
    marginTop: spacing.xs,
  },
  customBlendContext: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
    letterSpacing: -0.1,
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: atelierColors.border,
    alignSelf: 'stretch',
  },
  removeButtonText: {
    ...atelierText.helper,
    fontSize: 13,
    color: colors.error,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  emptyTeaBox: {
    ...atelierCards.section,
    padding: spacing.lg,
    borderRadius: 20,
  },
  emptyTeaText: {
    ...atelierText.bodyMuted,
    lineHeight: 22,
  },
  
  // Edit Form Styles
  editForm: { ...atelierCards.section, padding: spacing.xl, borderRadius: 24 },
  label: { ...atelierText.body, fontSize: 14, fontWeight: '600', marginBottom: spacing.md },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 22, backgroundColor: atelierColors.surfaceMuted, borderWidth: 1, borderColor: atelierColors.border },
  chipSelected: { backgroundColor: atelierColors.deepGreen, borderColor: atelierColors.deepGreen },
  chipText: { ...atelierText.bodyMuted, fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: atelierColors.surface, fontWeight: '600' },
  timeInput: { backgroundColor: atelierColors.surfaceMuted, borderRadius: 12, padding: spacing.md, fontSize: 15, borderWidth: 1, borderColor: atelierColors.border, width: 140, color: atelierColors.text }
});
