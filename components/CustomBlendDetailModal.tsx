import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBanner } from '@/components/StatusBanner';
import { atelierButtons, atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { CWaterBlendResult, getCWaterBlendVisualProfile } from '@/lib/cwaterBlendEngine';
import { createCustomBlendItemId } from '@/lib/teaBoxStorage';
import { CustomBlendOption, getCustomBlendVisualProfile } from '@/lib/customBlendEngine';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';

interface CustomBlendDetailModalProps {
  visible: boolean;
  option: CustomBlendOption | CWaterBlendResult | null;
  onClose: () => void;
}

export function CustomBlendDetailModal({
  visible,
  option,
  onClose,
}: CustomBlendDetailModalProps) {
  const router = useRouter();
  const { savedBlendItems, saveCustomBlendToBox, saveCWaterBlendToBox } = useStore();
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setFeedbackMessage('');
    }
  }, [visible, option?.displayName]);

  const isCWaterOption = Boolean(option && 'teas' in option);
  const customOption = option && !isCWaterOption ? (option as CustomBlendOption) : null;
  const cWaterOption = option && isCWaterOption ? (option as CWaterBlendResult) : null;

  const isSaved = useMemo(() => {
    if (cWaterOption) {
      return savedBlendItems.some((item) => item.id === `cwater:${cWaterOption.id}`);
    }

    if (!customOption) {
      return false;
    }

    return savedBlendItems.some((item) => item.id === createCustomBlendItemId(customOption));
  }, [customOption, savedBlendItems]);

  if (!option) {
    return null;
  }

  const customVisualProfile = customOption ? getCustomBlendVisualProfile(customOption) : null;
  const cWaterVisualProfile = cWaterOption ? getCWaterBlendVisualProfile(cWaterOption) : null;
  const openCustomBlendLab = () => {
    if (!customOption) {
      return;
    }

    const serializedOption = JSON.stringify(customOption);
    onClose();
    setTimeout(() => {
      router.push({
        pathname: '/custom-blend' as never,
        params: { option: serializedOption },
      } as never);
    }, 0);
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.handle} />

            <View style={styles.heroCard}>
              <View style={styles.headerRow}>
                <Text style={styles.eyebrow}>{isCWaterOption ? 'C.WATER 조합 테스트' : 'AI 블렌딩 제안'}</Text>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Text style={styles.closeText}>닫기</Text>
                </Pressable>
              </View>

              <Text style={styles.toneLabel}>
                {cWaterOption ? cWaterVisualProfile?.toneLabel : customOption?.toneLabel}
              </Text>
              <Text style={styles.title}>{option.displayName}</Text>
              <Text style={styles.summary}>{option.summary}</Text>
              <Text style={styles.detail}>{option.detail}</Text>
            </View>

            <View style={styles.metaCard}>
              <Text style={styles.sectionTitle}>전체 재료</Text>
              <Text style={styles.ingredientText}>
                {cWaterOption
                  ? cWaterVisualProfile?.ingredientNames.join(' · ')
                  : customOption?.ingredientNames.join(' · ')}
              </Text>
            </View>

            <View style={styles.metaCard}>
              <Text style={styles.sectionTitle}>핵심 태그</Text>
              <View style={styles.chipWrap}>
                {(cWaterOption ? cWaterVisualProfile?.tags ?? [] : customOption?.tags ?? []).map((tag: string) => (
                  <View key={tag} style={styles.chip}>
                    <Text style={styles.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.metaCard}>
              <Text style={styles.sectionTitle}>어울리는 흐름</Text>
              <Text style={styles.contextText}>
                {cWaterOption ? cWaterVisualProfile?.contextLine : customOption?.contextLine}
              </Text>

              <View style={styles.barGroup}>
                {(cWaterOption ? cWaterVisualProfile?.bars ?? [] : customVisualProfile?.bars ?? []).map((bar) => (
                  <View key={bar.key} style={styles.barRow}>
                    <Text style={styles.barLabel}>{bar.label}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${(bar.value / 5) * 100}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {isCWaterOption ? (
              <>
                <View style={styles.readOnlyCard}>
                  <Text style={styles.readOnlyTitle}>병렬 테스트 조합</Text>
                  <Text style={styles.readOnlyText}>
                    C.Water 조합은 기존 추천과 나란히 비교 중이에요. 마음에 들면 블렌드함에 먼저 담아둘 수 있어요.
                  </Text>
                </View>

                <Pressable
                  style={[styles.saveButton, isSaved && styles.saveButtonSaved]}
                  disabled={isSaved}
                  onPress={async () => {
                    const result = await saveCWaterBlendToBox(cWaterOption as CWaterBlendResult);
                    if (!result.added) {
                      setFeedbackMessage('이미 블렌드함에 담아둔 조합이에요.');
                      return;
                    }

                    if (__DEV__ && !result.synced) {
                      setFeedbackMessage('로컬에는 저장됐고, 동기화는 보류됐어요.');
                      return;
                    }

                    setFeedbackMessage('블렌드함에 담았어요.');
                  }}
                >
                  <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextSaved]}>
                    {isSaved ? '이미 블렌드함에 있어요' : '블렌드함에 담기'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={[styles.saveButton, isSaved && styles.saveButtonSaved]}
                  disabled={isSaved}
                  onPress={async () => {
                    const result = await saveCustomBlendToBox(customOption as CustomBlendOption);
                    if (!result.added) {
                      setFeedbackMessage('이미 블렌드함에 담아둔 조합이에요.');
                      return;
                    }

                    if (__DEV__ && !result.synced) {
                      setFeedbackMessage('로컬에는 저장됐고, 동기화는 보류됐어요.');
                      return;
                    }

                    setFeedbackMessage('블렌드함에 담았어요.');
                  }}
                >
                  <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextSaved]}>
                    {isSaved ? '이미 블렌드함에 있어요' : '블렌드함에 담기'}
                  </Text>
                </Pressable>

                <Text style={styles.adjustGuide}>마음에 드는 결이 있다면, 아래에서 비율을 직접 조절해 더 나에게 맞게 다듬을 수 있어요.</Text>

                <Pressable style={styles.adjustButton} onPress={openCustomBlendLab}>
                  <Text style={styles.adjustButtonText}>직접 조절하기</Text>
                </Pressable>
              </>
            )}

            {feedbackMessage ? (
              <StatusBanner
                message={feedbackMessage}
                tone={feedbackMessage.includes('동기화는 보류') ? 'muted' : 'success'}
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: atelierColors.overlay,
  },
  sheet: {
    backgroundColor: atelierColors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '82%',
  },
  content: {
    paddingBottom: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: atelierColors.border,
    marginBottom: spacing.md,
  },
  heroCard: {
    ...atelierCards.hero,
    backgroundColor: atelierColors.surfaceMuted,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl + spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    ...atelierText.helper,
    letterSpacing: 0.2,
  },
  closeText: {
    ...atelierButtons.inlineText,
  },
  toneLabel: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: atelierColors.deepGreen,
    letterSpacing: -0.1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreenMuted,
    borderWidth: 1,
    borderColor: '#CEDCD5',
  },
  title: {
    marginTop: spacing.md,
    ...atelierText.heroTitle,
    fontSize: 28,
    lineHeight: 34,
  },
  summary: {
    marginTop: spacing.md,
    ...atelierText.summary,
    fontSize: 17,
    lineHeight: 27,
    fontWeight: '600',
  },
  detail: {
    marginTop: spacing.md,
    ...atelierText.bodyMuted,
    lineHeight: 23,
  },
  metaCard: {
    marginTop: spacing.lg,
    ...atelierCards.section,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    ...atelierText.helper,
    marginBottom: spacing.sm,
    letterSpacing: 0.1,
  },
  ingredientText: {
    ...atelierText.body,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  chipText: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.text,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  contextText: {
    ...atelierText.body,
  },
  barGroup: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    width: 54,
    ...atelierText.helper,
    color: atelierColors.textSoft,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: atelierColors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreen,
  },
  saveButton: {
    marginTop: spacing.lg,
    ...atelierButtons.secondaryMuted,
    paddingVertical: 15,
  },
  saveButtonSaved: {
    backgroundColor: atelierColors.deepGreenMuted,
    borderColor: '#CEDCD5',
  },
  saveButtonText: {
    ...atelierText.summary,
    fontSize: 15,
    color: atelierColors.text,
    fontWeight: '700',
  },
  saveButtonTextSaved: {
    color: atelierColors.deepGreen,
  },
  adjustGuide: {
    marginTop: spacing.xl,
    ...atelierText.bodyMuted,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  adjustButton: {
    marginTop: spacing.sm,
    ...atelierButtons.primarySolid,
    paddingVertical: 18,
  },
  adjustButtonText: {
    ...atelierText.summary,
    color: atelierColors.surface,
    fontWeight: '700',
  },
  readOnlyCard: {
    marginTop: spacing.lg,
    ...atelierCards.meta,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 18,
  },
  readOnlyTitle: {
    ...atelierText.cardTitleMd,
    marginBottom: spacing.xs,
  },
  readOnlyText: {
    ...atelierText.bodyMuted,
    lineHeight: 21,
  },
});
