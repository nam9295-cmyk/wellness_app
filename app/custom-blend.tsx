import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomBlendCupVisual } from '@/components/CustomBlendCupVisual';
import { EmptyStateBlock } from '@/components/EmptyStateBlock';
import { CustomBlendProfileChart } from '@/components/CustomBlendProfileChart';
import { StatusBanner } from '@/components/StatusBanner';
import { atelierButtons, atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import {
  createAdjustedCustomBlendOption,
  createInitialCustomBlendRatios,
  CUSTOM_BLEND_BASE_RATIO,
  getCustomBlendLabReading,
  redistributeCustomBlendRatios,
} from '@/lib/customBlendLab';
import { CustomBlendOption } from '@/lib/customBlendEngine';
import {
  customBlendBaseIngredientId,
  customBlendIngredients,
  CustomBlendIngredientId,
} from '@/lib/customBlendIngredients';
import { createCustomBlendItemId } from '@/lib/teaBoxStorage';
import { spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';

function parseOption(rawOption: string | string[] | undefined): CustomBlendOption | null {
  const source = Array.isArray(rawOption) ? rawOption[0] : rawOption;

  if (!source) {
    return null;
  }

  try {
    return JSON.parse(source) as CustomBlendOption;
  } catch (error) {
    console.warn('Failed to parse custom blend option', error);
    return null;
  }
}

export default function CustomBlendScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ option?: string }>();
  const { saveCustomBlendToBox, savedBlendItems } = useStore();
  const option = useMemo(() => parseOption(params.option), [params.option]);
  const extraIngredientIds = useMemo(
    () => option?.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId) || [],
    [option]
  );
  const [blendRatios, setBlendRatios] = useState<Partial<Record<CustomBlendIngredientId, number>>>(
    () => (option ? createInitialCustomBlendRatios(option) : {})
  );
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const reading = useMemo(() => {
    if (!option) {
      return null;
    }

    return getCustomBlendLabReading(option, blendRatios);
  }, [option, blendRatios]);

  const adjustedOption = useMemo(() => {
    if (!option) {
      return null;
    }

    return createAdjustedCustomBlendOption(option, blendRatios);
  }, [option, blendRatios]);

  const isAlreadySaved = useMemo(() => {
    if (!adjustedOption) {
      return false;
    }

    return savedBlendItems.some((item) => item.id === createCustomBlendItemId(adjustedOption));
  }, [adjustedOption, savedBlendItems]);

  useEffect(() => {
    setFeedbackMessage('');
  }, [adjustedOption?.displayName, adjustedOption?.contextLine]);

  if (!option || !reading || !adjustedOption) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyStateWrap}>
          <EmptyStateBlock
            centered
            title="불러올 블렌드가 없어요"
            text="AI 블렌딩 제안에서 다시 들어와 주세요."
            ctaText="추천 카드에서 다시 선택하면 바로 이어서 조절할 수 있어요."
          />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>이전으로</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const heroTags = adjustedOption.tags.slice(0, 3);
  const ingredientPreview = extraIngredientIds.map((ingredientId) => customBlendIngredients[ingredientId].name).join(' · ');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.headerAction}>닫기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>커스텀 블렌딩</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.eyebrow}>현재 블렌드</Text>
              <Text style={styles.title}>{adjustedOption.displayName}</Text>
              <Text style={styles.summary}>{reading.summary}</Text>
            </View>
          </View>

          <View style={styles.heroVisualRow}>
            <View style={styles.heroPotWrap}>
              <CustomBlendCupVisual option={adjustedOption} blendRatios={blendRatios} />
            </View>
            <View style={styles.heroGraphWrap}>
              <CustomBlendProfileChart
                axes={reading.axes}
                title="프로파일"
                compact
                tiny
                embedded
                tone="atelier"
              />
            </View>
          </View>

          <View style={styles.heroChipWrap}>
            {heroTags.map((tag) => (
              <View key={tag} style={styles.heroChip}>
                <Text style={styles.heroChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>비율 조절</Text>
            <Text style={styles.sectionMeta}>카카오닙 {CUSTOM_BLEND_BASE_RATIO}% 고정</Text>
          </View>
          <Text style={styles.sectionLead}>끌리는 재료를 먼저 올리고, 나머지 결을 가볍게 정돈해 현재 무드를 맞춰보세요.</Text>
          <Text style={styles.sectionHint}>비율을 바꾸면 위 결과가 바로 업데이트돼요.</Text>

          <View style={styles.fixedIngredientRow}>
            <Text style={styles.fixedIngredientName}>카카오닙</Text>
            <Text style={styles.fixedIngredientValue}>{CUSTOM_BLEND_BASE_RATIO}%</Text>
          </View>

          {extraIngredientIds.map((ingredientId, index) => {
            const value = blendRatios[ingredientId] ?? 0;
            const ingredient = customBlendIngredients[ingredientId];
            const canAdjust = extraIngredientIds.length > 1;
            const isLast = index === extraIngredientIds.length - 1;

            return (
              <View key={ingredientId} style={[styles.sliderRow, isLast && styles.sliderRowLast]}>
                <View style={styles.sliderLabelRow}>
                  <Text style={styles.sliderLabel}>{ingredient.name}</Text>
                  <Text style={styles.sliderValue}>{value}%</Text>
                </View>
                <View style={styles.sliderControlRow}>
                  <Pressable
                    style={[styles.stepButton, !canAdjust && styles.stepButtonDisabled]}
                    disabled={!canAdjust}
                    onPress={() => {
                      setBlendRatios((prev) =>
                        redistributeCustomBlendRatios(extraIngredientIds, prev, ingredientId, value - 5)
                      );
                    }}
                  >
                    <Text style={styles.stepButtonText}>−</Text>
                  </Pressable>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${(value / 75) * 100}%` }]} />
                  </View>
                  <Pressable
                    style={[styles.stepButton, !canAdjust && styles.stepButtonDisabled]}
                    disabled={!canAdjust}
                    onPress={() => {
                      setBlendRatios((prev) =>
                        redistributeCustomBlendRatios(extraIngredientIds, prev, ingredientId, value + 5)
                      );
                    }}
                  >
                    <Text style={styles.stepButtonText}>＋</Text>
                  </Pressable>
                </View>
                <Text style={styles.sliderHint}>{ingredient.notes.slice(0, 2).join(' · ')}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.profileCard}>

          <View style={styles.profileSummaryWrap}>
            <Text style={styles.analysisType}>{reading.typeName}</Text>
            <Text style={styles.analysisLead}>{reading.summary}</Text>
            <Text style={styles.analysisFlavor}>{reading.flavorMoodLine}</Text>

            <View style={styles.signatureRow}>
              <View style={styles.signatureCard}>
                <Text style={styles.signatureLabel}>가까운 시그니처</Text>
                <Text style={styles.signatureName}>{reading.primaryMatch.name}</Text>
                <Text style={styles.signatureScore}>유사도 {reading.primaryMatch.similarity}%</Text>
              </View>
              <View style={styles.signatureCard}>
                <Text style={styles.signatureLabel}>함께 닿는 결</Text>
                <Text style={styles.signatureName}>{reading.secondaryMatch.name}</Text>
                <Text style={styles.signatureScoreMuted}>유사도 {reading.secondaryMatch.similarity}%</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.analysisCard}>
          <View style={styles.analysisBlock}>
            <Text style={styles.analysisBlockLabel}>잘 맞는 순간</Text>
            <View style={styles.momentWrap}>
              {reading.moments.map((moment) => (
                <View key={moment} style={styles.momentChip}>
                  <Text style={styles.momentChipText}>{moment}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.analysisBlock}>
            <Text style={styles.analysisBlockLabel}>이 조합의 포인트</Text>
            <View style={styles.featureList}>
              {reading.features.map((feature) => (
                <Text key={feature} style={styles.featureText}>
                  • {feature}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerLabel}>저장될 조합</Text>
          <Text style={styles.footerTitle}>{adjustedOption.displayName}</Text>
          <Text style={styles.footerSummary}>{adjustedOption.summary}</Text>
          <Text style={styles.footerGuide}>지금 비율 그대로 블렌드함에 담아두면 다른 조합과 나중에 다시 비교하기 쉬워져요.</Text>
          <Text style={styles.footerText}>
            {ingredientPreview}
          </Text>

          <Pressable
            style={[styles.saveButton, isAlreadySaved && styles.saveButtonSaved]}
            disabled={isAlreadySaved}
            onPress={async () => {
              const result = await saveCustomBlendToBox(adjustedOption);

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
            <Text style={[styles.saveButtonText, isAlreadySaved && styles.saveButtonTextSaved]}>
              {isAlreadySaved ? '이미 같은 비율로 담겨 있어요' : '이 비율로 블렌드함에 담기'}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>추천 결과로 돌아가기</Text>
          </Pressable>

          {feedbackMessage ? (
            <StatusBanner
              message={feedbackMessage}
              tone={feedbackMessage.includes('동기화는 보류') ? 'muted' : 'success'}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: atelierColors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.xs,
  },
  headerAction: {
    ...atelierButtons.inlineText,
  },
  headerTitle: {
    ...atelierText.screenTitle,
  },
  headerSpacer: {
    width: 32,
  },
  heroCard: {
    ...atelierCards.hero,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  heroHeader: {
    marginBottom: spacing.md,
  },
  heroTextWrap: {
    gap: 0,
  },
  eyebrow: {
    ...atelierText.helper,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  title: {
    ...atelierText.heroTitle,
    fontSize: 28,
    marginTop: spacing.sm,
    lineHeight: 34,
  },
  summary: {
    ...atelierText.summary,
    lineHeight: 26,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  heroVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  heroPotWrap: {
    flex: 1.18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 176,
  },
  heroGraphWrap: {
    flex: 0.82,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  heroChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  heroChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreenMuted,
    borderWidth: 1,
    borderColor: '#CEDCD5',
  },
  heroChipText: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.deepGreen,
    fontWeight: '600',
  },
  sectionCard: {
    ...atelierCards.section,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...atelierText.helper,
    fontSize: 13,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    fontSize: 12,
    color: atelierColors.deepGreenSoft,
    fontWeight: '700',
  },
  sectionLead: {
    ...atelierText.body,
    lineHeight: 21,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  sectionHint: {
    ...atelierText.bodyMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.xl,
    letterSpacing: -0.1,
  },
  fixedIngredientRow: {
    ...atelierCards.meta,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  fixedIngredientName: {
    fontSize: 14,
    color: atelierColors.title,
    fontWeight: '600',
  },
  fixedIngredientValue: {
    fontSize: 14,
    color: atelierColors.deepGreen,
    fontWeight: '700',
  },
  sliderRow: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: atelierColors.border + '80',
  },
  sliderRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  sliderLabel: {
    ...atelierText.body,
    color: atelierColors.title,
    fontWeight: '600',
  },
  sliderValue: {
    ...atelierText.cardTitleMd,
    color: atelierColors.deepGreen,
  },
  sliderControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: atelierColors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: atelierColors.borderStrong,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  stepButtonText: {
    fontSize: 18,
    color: atelierColors.cocoaStrong,
    fontWeight: '700',
  },
  sliderTrack: {
    flex: 1,
    height: 13,
    borderRadius: 999,
    backgroundColor: atelierColors.track,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: atelierColors.deepGreen,
    borderRadius: 999,
  },
  sliderHint: {
    ...atelierText.helper,
    color: atelierColors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 19,
    letterSpacing: -0.05,
  },
  profileCard: {
    ...atelierCards.section,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  profileSummaryWrap: {
    gap: spacing.sm,
  },
  analysisType: {
    ...atelierText.cardTitleLg,
  },
  analysisLead: {
    ...atelierText.body,
    lineHeight: 22,
    fontWeight: '500',
  },
  analysisFlavor: {
    ...atelierText.bodyMuted,
    fontSize: 13,
    lineHeight: 21,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  signatureCard: {
    ...atelierCards.meta,
    flex: 1,
    padding: spacing.md,
  },
  signatureLabel: {
    fontSize: 11,
    color: atelierColors.textSoft,
    fontWeight: '700',
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  signatureName: {
    fontSize: 16,
    color: atelierColors.title,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  signatureScore: {
    fontSize: 12,
    color: atelierColors.deepGreen,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  signatureScoreMuted: {
    fontSize: 12,
    color: atelierColors.textMuted,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  analysisCard: {
    ...atelierCards.section,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  analysisBlock: {
    gap: spacing.sm,
  },
  analysisBlockLabel: {
    fontSize: 12,
    color: atelierColors.textSoft,
    fontWeight: '700',
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  momentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  momentChip: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#D5E1DB',
  },
  momentChipText: {
    fontSize: 12,
    color: atelierColors.deepGreen,
    fontWeight: '600',
  },
  featureList: {
    gap: spacing.xs,
  },
  featureText: {
    fontSize: 13,
    color: atelierColors.textMuted,
    lineHeight: 20,
  },
  footerCard: {
    ...atelierCards.hero,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 24,
  },
  footerLabel: {
    fontSize: 12,
    color: atelierColors.textSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footerTitle: {
    ...atelierText.cardTitleMd,
    marginTop: spacing.xs,
  },
  footerSummary: {
    ...atelierText.body,
    marginTop: spacing.sm,
    lineHeight: 22,
    fontWeight: '500',
  },
  footerGuide: {
    ...atelierText.bodyMuted,
    fontSize: 13,
    marginTop: spacing.md,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  footerText: {
    ...atelierText.bodyMuted,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  saveButton: {
    ...atelierButtons.primarySolid,
    marginTop: spacing.xl,
    paddingVertical: 18,
  },
  saveButtonSaved: {
    backgroundColor: atelierColors.surfaceMuted,
    borderWidth: 1,
    borderColor: atelierColors.deepGreenSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    ...atelierText.summary,
    color: atelierColors.surface,
    fontWeight: '700',
  },
  saveButtonTextSaved: {
    color: atelierColors.deepGreen,
  },
  secondaryButton: {
    ...atelierButtons.secondaryMuted,
    marginTop: spacing.md,
    paddingVertical: 15,
  },
  secondaryButtonText: {
    ...atelierButtons.inlineText,
    color: atelierColors.text,
  },
  emptyStateWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginTop: spacing.lg,
    ...atelierButtons.primarySolid,
    shadowOpacity: 0,
    elevation: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  backButtonText: {
    ...atelierText.summary,
    fontSize: 15,
    color: atelierColors.surface,
    fontWeight: '700',
  },
});
