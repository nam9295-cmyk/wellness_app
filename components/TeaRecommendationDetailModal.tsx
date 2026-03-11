import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBanner } from '@/components/StatusBanner';
import { TeaBlendInfoCard } from '@/components/TeaBlendInfoCard';
import { TeaProfileMeter } from '@/components/TeaProfileMeter';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { teaAssets } from '@/lib/teaAssets';
import { atelierButtons, atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { useStore } from '@/lib/store';
import { TeaRecommendationResult } from '@/lib/teaRecommendationEngine';
import { spacing } from '@/lib/theme';

interface TeaRecommendationDetailModalProps {
  visible: boolean;
  recommendation: TeaRecommendationResult;
  onClose: () => void;
  reasonTitle?: string;
}

export function TeaRecommendationDetailModal({
  visible,
  recommendation,
  onClose,
  reasonTitle = '오늘의 추천 이유',
}: TeaRecommendationDetailModalProps) {
  const { savedTeaIds, saveTeaToBox } = useStore();
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const asset = teaAssets[recommendation.teaId];

  const isSaved = savedTeaIds.includes(recommendation.teaId);

  useEffect(() => {
    if (visible) {
      setFeedbackMessage('');
    }
  }, [visible, recommendation.teaId]);

  const handleSaveTea = async () => {
    if (isSaved) {
      return;
    }

    const result = await saveTeaToBox(recommendation.teaId);
    setFeedbackMessage(result.added ? '블렌드함에 담았어요' : '이미 담아둔 블렌드예요');
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.handle} />

            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: asset.backgroundColor,
                  borderColor: asset.accentColor + '28',
                },
              ]}
            >
              <View style={styles.heroTopRow}>
                <Text style={styles.heroEyebrow}>오늘의 추천 블렌드</Text>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Text style={styles.closeText}>닫기</Text>
                </Pressable>
              </View>

              <View style={styles.heroImageWrap}>
                <TeaThumbnail teaId={recommendation.teaId} size="xl" />
              </View>

              <Text style={styles.title}>{recommendation.content.name}</Text>
              <Text style={styles.identityLine}>{recommendation.content.identityLine}</Text>
              <Text style={[styles.subtitle, { color: asset.accentColor }]}>{recommendation.content.subtitle}</Text>
              <Text style={styles.description}>{recommendation.content.description}</Text>

              <Text style={styles.keywordTitle}>핵심 키워드</Text>
              <View style={styles.keywordWrap}>
                {recommendation.content.flavorKeywords.slice(0, 3).map((keyword) => (
                  <View key={keyword} style={styles.keywordChip}>
                    <Text style={styles.keywordText}>{keyword}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TeaProfileMeter teaId={recommendation.teaId} />

            <View style={styles.metaGrid}>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>추천 시간대</Text>
                <View style={styles.metaChipWrap}>
                  {recommendation.content.timings.map((timing) => (
                    <View key={timing} style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{timing}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>이럴 때 좋아요</Text>
                <View style={styles.metaChipWrap}>
                  {recommendation.content.situations.map((situation) => (
                    <View key={situation} style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{situation}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.reasonCard}>
              <Text style={styles.sectionLabel}>{reasonTitle}</Text>
              <Text style={styles.bodyText}>{recommendation.reason}</Text>
              <Text style={styles.contextText}>{recommendation.contextLine}</Text>
            </View>

            <View style={styles.actionSection}>
              <Pressable
                style={[styles.saveButton, isSaved && styles.saveButtonSaved]}
                onPress={handleSaveTea}
                disabled={isSaved}
              >
              <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextSaved]}>
                  {isSaved ? '이미 담아둔 블렌드예요' : '블렌드함에 담기'}
              </Text>
            </Pressable>
              {feedbackMessage ? (
                <StatusBanner message={feedbackMessage} tone={feedbackMessage.includes('이미') ? 'muted' : 'success'} />
              ) : null}
            </View>

            {recommendation.secondaryContent && recommendation.secondaryTeaId ? (
              <TeaBlendInfoCard
                teaId={recommendation.secondaryTeaId}
                content={recommendation.secondaryContent}
                title="함께 추천하는 블렌드"
                compact
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '84%',
    shadowColor: atelierColors.cocoaStrong,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 22,
    elevation: 12,
  },
  sheetContent: {
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
    borderRadius: 28,
    padding: spacing.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEyebrow: {
    ...atelierText.helper,
    letterSpacing: 0.2,
  },
  heroImageWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    ...atelierText.cardTitleLg,
    fontSize: 26,
    letterSpacing: -0.55,
  },
  subtitle: {
    marginTop: 4,
    ...atelierText.helper,
    fontSize: 13,
    color: atelierColors.deepGreen,
  },
  identityLine: {
    marginTop: spacing.sm,
    ...atelierText.summary,
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  closeText: {
    ...atelierButtons.inlineText,
  },
  description: {
    marginTop: spacing.sm,
    ...atelierText.bodyMuted,
  },
  keywordTitle: {
    marginTop: spacing.md,
    ...atelierText.helper,
    letterSpacing: 0.1,
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  keywordChip: {
    ...atelierCards.meta,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  keywordText: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.text,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  reasonCard: {
    marginTop: spacing.lg,
    ...atelierCards.section,
    borderRadius: 24,
    padding: spacing.md,
  },
  metaGrid: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  metaCard: {
    ...atelierCards.section,
    borderRadius: 20,
    padding: spacing.md,
  },
  metaLabel: {
    ...atelierText.helper,
    marginBottom: spacing.xs,
    letterSpacing: 0.1,
  },
  metaChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaChip: {
    ...atelierCards.meta,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaChipText: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.text,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  actionSection: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...atelierText.helper,
    fontSize: 13,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  bodyText: {
    ...atelierText.summary,
    fontSize: 15,
  },
  contextText: {
    marginTop: spacing.xs,
    ...atelierText.bodyMuted,
    fontSize: 13,
  },
  saveButton: {
    ...atelierButtons.primarySolid,
    paddingVertical: 15,
  },
  saveButtonSaved: {
    backgroundColor: atelierColors.deepGreenMuted,
    borderWidth: 1,
    borderColor: atelierColors.deepGreenSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    ...atelierText.summary,
    fontSize: 15,
    fontWeight: '700',
    color: atelierColors.surface,
  },
  saveButtonTextSaved: {
    color: atelierColors.deepGreen,
  },
});
