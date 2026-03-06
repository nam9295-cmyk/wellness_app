import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TeaBlendInfoCard } from '@/components/TeaBlendInfoCard';
import { TeaProfileMeter } from '@/components/TeaProfileMeter';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { teaAssets } from '@/lib/teaAssets';
import { useStore } from '@/lib/store';
import { TeaRecommendationResult } from '@/lib/teaRecommendationEngine';
import { colors, spacing } from '@/lib/theme';

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
  reasonTitle = '오늘 잘 맞는 이유',
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
    const result = await saveTeaToBox(recommendation.teaId);
    setFeedbackMessage(result.added ? '내 티함에 담아두었어요.' : '이미 티함에 담아둔 블렌드예요.');
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
              <Text style={[styles.subtitle, { color: asset.accentColor }]}>{recommendation.content.subtitle}</Text>
              <Text style={styles.description}>{recommendation.content.description}</Text>

              <Text style={styles.keywordTitle}>핵심 무드</Text>
              <View style={styles.keywordWrap}>
                {recommendation.content.flavorKeywords.slice(0, 3).map((keyword) => (
                  <View key={keyword} style={styles.keywordChip}>
                    <Text style={styles.keywordText}>{keyword}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.reasonCard}>
              <Text style={styles.sectionLabel}>{reasonTitle}</Text>
              <Text style={styles.bodyText}>{recommendation.reason}</Text>
              <Text style={styles.contextText}>{recommendation.contextLine}</Text>
            </View>

            <TeaProfileMeter teaId={recommendation.teaId} />

            <View style={styles.metaGrid}>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>잘 맞는 시간대</Text>
                <View style={styles.metaChipWrap}>
                  {recommendation.content.timings.map((timing) => (
                    <View key={timing} style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{timing}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>잘 맞는 상황</Text>
                <View style={styles.metaChipWrap}>
                  {recommendation.content.situations.map((situation) => (
                    <View key={situation} style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{situation}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.actionSection}>
              <Pressable style={[styles.saveButton, isSaved && styles.saveButtonSaved]} onPress={handleSaveTea}>
                <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextSaved]}>
                  {isSaved ? '이미 티함에 담겨 있어요' : '내 티함에 담기'}
                </Text>
              </Pressable>
              {feedbackMessage ? (
                <Text style={styles.feedbackText}>{feedbackMessage}</Text>
              ) : null}
            </View>

            {recommendation.secondaryContent && recommendation.secondaryTeaId ? (
              <TeaBlendInfoCard
                teaId={recommendation.secondaryTeaId}
                content={recommendation.secondaryContent}
                title="함께 볼 블렌드"
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
    backgroundColor: 'rgba(48, 42, 41, 0.28)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '84%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
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
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 0.2,
  },
  heroImageWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  description: {
    marginTop: spacing.md,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
  },
  keywordTitle: {
    marginTop: spacing.md,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 0.1,
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  keywordChip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keywordText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
  },
  reasonCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaGrid: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  metaCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.xs,
    letterSpacing: 0.1,
  },
  metaChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaChip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
  },
  actionSection: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
  },
  contextText: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textLight,
    letterSpacing: -0.2,
  },
  saveButton: {
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonSaved: {
    backgroundColor: colors.primaryLight,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.card,
    letterSpacing: -0.1,
  },
  saveButtonTextSaved: {
    color: colors.text,
  },
  feedbackText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textLight,
    letterSpacing: -0.2,
  },
});
