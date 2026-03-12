import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const cacaoSteps = [0, 10, 20, 30] as const;
  const router = useRouter();
  const { savedBlendItems, saveCustomBlendToBox, saveCWaterBlendToBox } = useStore();
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [cacaoNibLevel, setCacaoNibLevel] = useState<0 | 10 | 20 | 30>(0);
  const [cacaoPreviewValue, setCacaoPreviewValue] = useState(0);
  const [cacaoSliderWidth, setCacaoSliderWidth] = useState(0);
  const [isAdjustingCacao, setIsAdjustingCacao] = useState(false);
  const cacaoProgress = useRef(new Animated.Value(0)).current;
  const dragStartRatioRef = useRef(0);
  const cacaoDidDragRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setFeedbackMessage('');
      setCacaoNibLevel(0);
      setCacaoPreviewValue(0);
      cacaoProgress.setValue(0);
    }
  }, [visible, option?.displayName, cacaoProgress]);

  const isCWaterOption = Boolean(option && 'teas' in option);
  const customOption = option && !isCWaterOption ? (option as CustomBlendOption) : null;
  const cWaterOption = option && isCWaterOption ? (option as CWaterBlendResult) : null;

  const snapCacaoLevel = (rawValue: number) => {
    return cacaoSteps.reduce((closest, step) =>
      Math.abs(step - rawValue) < Math.abs(closest - rawValue) ? step : closest
    , cacaoSteps[0]);
  };

  const applyCacaoRatio = (ratio: number, shouldSnap: boolean) => {
    if (!cacaoSliderWidth) {
      return;
    }

    const clampedRatio = Math.max(0, Math.min(ratio, 1));
    const rawValue = Math.round(clampedRatio * 30);

    setCacaoPreviewValue(rawValue);
    cacaoProgress.setValue(clampedRatio);

    if (shouldSnap) {
      const snappedValue = snapCacaoLevel(rawValue);
      setCacaoNibLevel(snappedValue);
      setCacaoPreviewValue(snappedValue);
      Animated.timing(cacaoProgress, {
        toValue: snappedValue / 30,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  };

  const cacaoPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setIsAdjustingCacao(true);
          cacaoDidDragRef.current = false;
          dragStartRatioRef.current = cacaoNibLevel / 30;
          applyCacaoRatio(dragStartRatioRef.current, false);
        },
        onPanResponderMove: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > 2) {
            cacaoDidDragRef.current = true;
          }
          const nextRatio =
            dragStartRatioRef.current +
            (cacaoSliderWidth > 0 ? gestureState.dx / cacaoSliderWidth : 0);
          applyCacaoRatio(nextRatio, false);
        },
        onPanResponderRelease: (event, gestureState) => {
          if (!cacaoDidDragRef.current) {
            const tappedRatio =
              cacaoSliderWidth > 0
                ? Math.max(0, Math.min(event.nativeEvent.locationX / cacaoSliderWidth, 1))
                : cacaoNibLevel / 30;
            applyCacaoRatio(tappedRatio, true);
          } else {
            const nextRatio =
              dragStartRatioRef.current +
              (cacaoSliderWidth > 0 ? gestureState.dx / cacaoSliderWidth : 0);
            applyCacaoRatio(nextRatio, true);
          }
          setIsAdjustingCacao(false);
        },
        onPanResponderTerminate: (event, gestureState) => {
          if (!cacaoDidDragRef.current) {
            const tappedRatio =
              cacaoSliderWidth > 0
                ? Math.max(0, Math.min(event.nativeEvent.locationX / cacaoSliderWidth, 1))
                : cacaoNibLevel / 30;
            applyCacaoRatio(tappedRatio, true);
          } else {
            const nextRatio =
              dragStartRatioRef.current +
              (cacaoSliderWidth > 0 ? gestureState.dx / cacaoSliderWidth : 0);
            applyCacaoRatio(nextRatio, true);
          }
          setIsAdjustingCacao(false);
        },
      }),
    [cacaoNibLevel, cacaoSliderWidth]
  );

  const cacaoFillWidth = Animated.multiply(cacaoProgress, cacaoSliderWidth);
  const cacaoThumbOffset = Animated.multiply(cacaoProgress, Math.max(cacaoSliderWidth - 28, 0));

  const isSaved = useMemo(() => {
    if (cWaterOption) {
      return savedBlendItems.some((item) => item.id === `cwater:${cWaterOption.id}:${cacaoNibLevel}`);
    }

    if (!customOption) {
      return false;
    }

    return savedBlendItems.some((item) => item.id === createCustomBlendItemId(customOption));
  }, [cWaterOption, cacaoNibLevel, customOption, savedBlendItems]);

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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            scrollEnabled={!isAdjustingCacao}
          >
            <View style={styles.handle} />

            <View style={[styles.heroCard, isCWaterOption && styles.cWaterHeroCard]}>
              <View style={styles.headerRow}>
                <Text style={styles.eyebrow}>{isCWaterOption ? 'C.WATER CURATED' : 'AI 블렌딩 제안'}</Text>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Text style={styles.closeText}>닫기</Text>
                </Pressable>
              </View>

              {isCWaterOption ? (
                <View style={styles.cWaterHeroMetaRow}>
                  <Text style={[styles.toneLabel, styles.cWaterToneLabel]}>
                    {cWaterVisualProfile?.toneLabel}
                  </Text>
                  <View style={styles.cWaterHeaderPill}>
                    <Text style={styles.cWaterHeaderPillText}>
                      {cWaterVisualProfile?.ingredientNames.length ?? 0}가지 구성
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.toneLabel}>{customOption?.toneLabel}</Text>
              )}
              <Text style={[styles.title, isCWaterOption && styles.cWaterTitle]}>{option.displayName}</Text>
              <Text style={[styles.summary, isCWaterOption && styles.cWaterSummary]}>{option.summary}</Text>
              <Text style={[styles.detail, isCWaterOption && styles.cWaterDetail]}>{option.detail}</Text>
            </View>

            <View style={[styles.metaCard, isCWaterOption && styles.cWaterMetaCard]}>
              <Text style={styles.sectionTitle}>전체 재료</Text>
              {isCWaterOption ? (
                <>
                  <Text style={styles.cWaterSectionLead}>지금 흐름에 맞춰 구성된 티 조합이에요.</Text>
                  <View style={styles.ingredientChipWrap}>
                    {(cWaterVisualProfile?.ingredientNames ?? []).map((ingredient) => (
                      <View key={ingredient} style={[styles.ingredientChip, styles.cWaterIngredientChip]}>
                        <Text style={styles.ingredientChipText}>{ingredient}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.ingredientText}>
                  {customOption?.ingredientNames.join(' · ')}
                </Text>
              )}
            </View>

            <View style={[styles.metaCard, isCWaterOption && styles.cWaterMetaCard]}>
              <Text style={styles.sectionTitle}>핵심 태그</Text>
              {isCWaterOption ? <Text style={styles.cWaterSectionLead}>블렌드의 인상을 빠르게 읽어보세요.</Text> : null}
              <View style={styles.chipWrap}>
                {(cWaterOption ? cWaterVisualProfile?.tags ?? [] : customOption?.tags ?? []).map((tag: string) => (
                  <View key={tag} style={[styles.chip, isCWaterOption && styles.cWaterChip]}>
                    <Text style={[styles.chipText, isCWaterOption && styles.cWaterChipText]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.metaCard, isCWaterOption && styles.cWaterMetaCard]}>
              <Text style={styles.sectionTitle}>어울리는 흐름</Text>
              <Text style={[styles.contextText, isCWaterOption && styles.cWaterContextText]}>
                {cWaterOption ? cWaterVisualProfile?.contextLine : customOption?.contextLine}
              </Text>

              <View style={[styles.barGroup, isCWaterOption && styles.cWaterBarGroup]}>
                {(cWaterOption ? cWaterVisualProfile?.bars ?? [] : customVisualProfile?.bars ?? []).map((bar) => (
                  <View key={bar.key} style={styles.barRow}>
                    <Text style={[styles.barLabel, isCWaterOption && styles.cWaterBarLabel]}>{bar.label}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, isCWaterOption && styles.cWaterBarFill, { width: `${(bar.value / 5) * 100}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {isCWaterOption ? (
              <>
                <View style={[styles.metaCard, styles.cWaterMetaCard]}>
                  <Text style={styles.sectionTitle}>카카오 농도</Text>
                  <Text style={styles.cWaterSectionLead}>현재 조합 위에 카카오 풍미를 4단계로 조절할 수 있어요.</Text>
                  <View style={styles.cacaoValueRow}>
                    <Text style={styles.cacaoValueLabel}>현재 선택</Text>
                    <Text style={styles.cacaoValueText}>{cacaoPreviewValue}</Text>
                  </View>
                  <View
                    style={styles.cacaoSliderWrap}
                    onLayout={(event) => setCacaoSliderWidth(event.nativeEvent.layout.width)}
                    {...cacaoPanResponder.panHandlers}
                  >
                    <View style={styles.cacaoSliderTrack} />
                    <Animated.View style={[styles.cacaoSliderFill, { width: cacaoFillWidth }]} />
                    <View style={styles.cacaoStepRow} pointerEvents="none">
                      {cacaoSteps.map((level) => (
                        <View key={level} style={styles.cacaoStepMark} />
                      ))}
                    </View>
                    <Animated.View style={[styles.cacaoSliderThumb, { transform: [{ translateX: cacaoThumbOffset }] }]} />
                  </View>
                  <View style={styles.cacaoTickLabelRow}>
                    {cacaoSteps.map((level) => (
                      <Text key={level} style={[styles.cacaoTickLabel, cacaoNibLevel === level && styles.cacaoTickLabelActive]}>
                        {level}
                      </Text>
                    ))}
                  </View>
                </View>

                <View style={[styles.readOnlyCard, styles.cWaterReadOnlyCard]}>
                  <Text style={styles.readOnlyTitle}>추천 조합</Text>
                  <Text style={styles.readOnlyText}>
                    지금 흐름을 바탕으로 정리한 C.Water 조합이에요. 마음에 들면 블렌드함에 담아두고 다시 살펴볼 수 있어요.
                  </Text>
                </View>

                <Text style={styles.cWaterSaveGuide}>마음에 드는 조합이라면 블렌드함에 담아두고 나중에 다시 비교해볼 수 있어요.</Text>
                <Pressable
                  style={[styles.saveButton, styles.cWaterSaveButton, isSaved && styles.saveButtonSaved]}
                  disabled={isSaved}
                  onPress={async () => {
                    const result = await saveCWaterBlendToBox(cWaterOption as CWaterBlendResult, cacaoNibLevel);
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
  cWaterHeroCard: {
    backgroundColor: atelierColors.surface,
    borderColor: atelierColors.deepGreenSoft,
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
  cWaterToneLabel: {
    backgroundColor: atelierColors.deepGreen,
    borderColor: atelierColors.deepGreen,
    color: atelierColors.surface,
  },
  cWaterHeroMetaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cWaterHeaderPill: {
    backgroundColor: atelierColors.deepGreenMuted,
    borderWidth: 1,
    borderColor: atelierColors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cWaterHeaderPillText: {
    ...atelierText.pill,
    color: atelierColors.text,
  },
  title: {
    marginTop: spacing.md,
    ...atelierText.heroTitle,
    fontSize: 28,
    lineHeight: 34,
  },
  cWaterTitle: {
    fontSize: 30,
    lineHeight: 36,
  },
  summary: {
    marginTop: spacing.md,
    ...atelierText.summary,
    fontSize: 17,
    lineHeight: 27,
    fontWeight: '600',
  },
  cWaterSummary: {
    color: atelierColors.text,
    fontWeight: '700',
    lineHeight: 28,
  },
  detail: {
    marginTop: spacing.md,
    ...atelierText.bodyMuted,
    lineHeight: 23,
  },
  cWaterDetail: {
    marginTop: spacing.md,
    color: atelierColors.textMuted,
    lineHeight: 24,
  },
  metaCard: {
    marginTop: spacing.lg,
    ...atelierCards.section,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cWaterMetaCard: {
    borderColor: atelierColors.borderStrong,
  },
  sectionTitle: {
    ...atelierText.helper,
    marginBottom: spacing.sm,
    letterSpacing: 0.1,
  },
  ingredientText: {
    ...atelierText.body,
  },
  ingredientChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cWaterSectionLead: {
    ...atelierText.bodyMuted,
    marginBottom: spacing.sm,
  },
  ingredientChip: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  ingredientChipText: {
    ...atelierText.body,
    fontSize: 13,
    color: atelierColors.deepGreen,
    fontWeight: '600',
  },
  cWaterIngredientChip: {
    backgroundColor: atelierColors.surface,
    borderColor: atelierColors.deepGreenSoft,
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
  cWaterChip: {
    backgroundColor: atelierColors.deepGreenMuted,
    borderColor: atelierColors.deepGreenSoft,
  },
  cWaterChipText: {
    color: atelierColors.deepGreen,
    fontWeight: '700',
  },
  contextText: {
    ...atelierText.body,
  },
  cWaterContextText: {
    lineHeight: 23,
    color: atelierColors.text,
  },
  barGroup: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  cWaterBarGroup: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  cacaoValueRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  cacaoValueLabel: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
  },
  cacaoValueText: {
    ...atelierText.cardTitleLg,
    color: atelierColors.deepGreen,
  },
  cacaoSliderWrap: {
    marginTop: spacing.md,
    height: 34,
    justifyContent: 'center',
  },
  cacaoSliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 999,
    backgroundColor: atelierColors.border,
  },
  cacaoSliderFill: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreen,
  },
  cacaoStepRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cacaoStepMark: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: atelierColors.surface,
    borderWidth: 1.5,
    borderColor: atelierColors.borderStrong,
  },
  cacaoSliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: atelierColors.surface,
    borderWidth: 2,
    borderColor: atelierColors.deepGreen,
    shadowColor: atelierColors.deepGreen,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  cacaoTickLabelRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cacaoTickLabel: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
  },
  cacaoTickLabelActive: {
    color: atelierColors.deepGreen,
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
  cWaterBarLabel: {
    width: 62,
    color: atelierColors.text,
    fontWeight: '700',
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
  cWaterBarFill: {
    backgroundColor: atelierColors.deepGreen,
  },
  saveButton: {
    marginTop: spacing.lg,
    ...atelierButtons.secondaryMuted,
    paddingVertical: 15,
  },
  cWaterSaveButton: {
    ...atelierButtons.primarySolid,
    paddingVertical: 17,
    marginTop: spacing.xl,
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
  cWaterReadOnlyCard: {
    marginTop: spacing.xl,
  },
  cWaterSaveGuide: {
    marginTop: spacing.xl,
    ...atelierText.bodyMuted,
    textAlign: 'center',
    lineHeight: 21,
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
