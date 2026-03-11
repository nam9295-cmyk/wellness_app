import { StyleSheet, Text, View } from 'react-native';
import { TeaThumbnail } from '@/components/TeaThumbnail';
import { atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { TeaRecommendationContent, TeaRecommendationId } from '@/lib/teaRecommendationContent';
import { getTeaProfileHighlights } from '@/lib/teaProfiles';
import { spacing } from '@/lib/theme';

interface TeaBlendInfoCardProps {
  teaId: TeaRecommendationId;
  content: TeaRecommendationContent;
  title?: string;
  compact?: boolean;
}

export function TeaBlendInfoCard({
  teaId,
  content,
  title = '블렌드 상세 보기',
  compact = false,
}: TeaBlendInfoCardProps) {
  const profileHighlights = getTeaProfileHighlights(teaId);

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.heroRow}>
        <TeaThumbnail teaId={teaId} size={compact ? 'sm' : 'md'} />
        <View style={styles.heroText}>
          <Text style={styles.name}>{content.name}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
          <Text style={styles.description} numberOfLines={compact ? 2 : undefined}>{content.description}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>풍미 키워드</Text>
        <View style={styles.keywordWrap}>
          {content.flavorKeywords.slice(0, compact ? 3 : 4).map((keyword) => (
            <View key={keyword} style={styles.keywordChip}>
              <Text style={styles.keywordText}>{keyword}</Text>
            </View>
          ))}
        </View>
      </View>

      {!compact ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>블렌드 인상</Text>
            <Text style={styles.metaText}>{profileHighlights.join(' · ')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>추천 시간대</Text>
            <Text style={styles.metaText}>{content.timings.join(' · ')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>이럴 때 좋아요</Text>
            <Text style={styles.metaText}>{content.situations.join(' · ')}</Text>
          </View>
        </>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>오늘의 흐름</Text>
          <Text style={styles.metaText}>{content.timings[0]} · {content.situations[0]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...atelierCards.section,
    marginTop: spacing.lg,
    borderRadius: 24,
    padding: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroText: {
    flex: 1,
  },
  compactCard: {
    marginTop: spacing.md,
  },
  cardTitle: {
    ...atelierText.helper,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  name: {
    ...atelierText.cardTitleMd,
  },
  subtitle: {
    marginTop: 4,
    ...atelierText.helper,
    fontSize: 13,
    color: atelierColors.deepGreen,
  },
  description: {
    marginTop: spacing.sm,
    ...atelierText.body,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    ...atelierText.helper,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  keywordChip: {
    ...atelierCards.meta,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  keywordText: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.text,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  metaText: {
    ...atelierText.body,
  },
});
