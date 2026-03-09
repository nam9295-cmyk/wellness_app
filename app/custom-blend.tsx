import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomBlendCupVisual } from '@/components/CustomBlendCupVisual';
import { CustomBlendProfileChart } from '@/components/CustomBlendProfileChart';
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
import { colors, spacing } from '@/lib/theme';
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
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>불러올 블렌드가 없어요</Text>
          <Text style={styles.emptyText}>AI 블렌딩 제안에서 다시 들어와 주세요.</Text>
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
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.eyebrow}>추천 조합에서 시작</Text>
              <Text style={styles.title}>{adjustedOption.displayName}</Text>
              <Text style={styles.summary}>{reading.summary}</Text>
            </View>

            <CustomBlendCupVisual option={adjustedOption} blendRatios={blendRatios} />
          </View>

          <View style={styles.heroChipWrap}>
            {heroTags.map((tag) => (
              <View key={tag} style={styles.heroChip}>
                <Text style={styles.heroChipText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.metricGrid}>
            {reading.highlightMetrics.map((metric) => (
              <View key={metric.key} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}/5</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>비율 조절</Text>
            <Text style={styles.sectionMeta}>카카오닙 {CUSTOM_BLEND_BASE_RATIO}% 고정</Text>
          </View>

          <View style={styles.fixedIngredientRow}>
            <Text style={styles.fixedIngredientName}>카카오닙</Text>
            <Text style={styles.fixedIngredientValue}>{CUSTOM_BLEND_BASE_RATIO}%</Text>
          </View>

          {extraIngredientIds.map((ingredientId) => {
            const value = blendRatios[ingredientId] ?? 0;
            const ingredient = customBlendIngredients[ingredientId];
            const canAdjust = extraIngredientIds.length > 1;

            return (
              <View key={ingredientId} style={styles.sliderRow}>
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
          <View style={styles.profileChartWrap}>
            <CustomBlendProfileChart
              axes={reading.axes}
              title="블렌드 프로파일"
              compact
              embedded
            />
          </View>

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
          <Text style={styles.footerText}>
            {ingredientPreview}
          </Text>

          <Pressable
            style={[styles.saveButton, isAlreadySaved && styles.saveButtonSaved]}
            disabled={isAlreadySaved}
            onPress={async () => {
              const result = await saveCustomBlendToBox(adjustedOption);

              if (!result.added) {
                setFeedbackMessage('이미 같은 비율로 담아둔 블렌드예요.');
                return;
              }

              if (__DEV__ && !result.synced) {
                setFeedbackMessage('블렌드함에 담았어요. Firestore 동기화는 보류됐어요.');
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

          {feedbackMessage ? <Text style={styles.feedbackText}>{feedbackMessage}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerAction: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 32,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    letterSpacing: -0.4,
  },
  summary: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginTop: spacing.sm,
    fontWeight: '600',
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  metricGrid: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    minWidth: '47%',
    flexGrow: 1,
    backgroundColor: colors.primaryLight + '18',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 0.1,
  },
  sectionMeta: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  fixedIngredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  fixedIngredientName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  fixedIngredientValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  sliderRow: {
    marginBottom: spacing.md,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sliderLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  sliderControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  stepButtonText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  sliderTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  sliderHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  profileCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  profileChartWrap: {
    alignItems: 'center',
  },
  profileSummaryWrap: {
    gap: spacing.sm,
  },
  analysisType: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  analysisLead: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  analysisFlavor: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 21,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  signatureCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signatureLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  signatureName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  signatureScore: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  signatureScoreMuted: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  analysisCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  analysisBlock: {
    gap: spacing.sm,
  },
  analysisBlockLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  momentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  momentChip: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  momentChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  featureList: {
    gap: spacing.xs,
  },
  featureText: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 20,
  },
  footerCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '700',
  },
  footerTitle: {
    marginTop: spacing.xs,
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  footerSummary: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  footerText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
  },
  saveButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonSaved: {
    backgroundColor: colors.primaryLight + '20',
  },
  saveButtonText: {
    color: colors.card,
    fontSize: 15,
    fontWeight: '700',
  },
  saveButtonTextSaved: {
    color: colors.primary,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  backButtonText: {
    fontSize: 15,
    color: colors.card,
    fontWeight: '700',
  },
});
