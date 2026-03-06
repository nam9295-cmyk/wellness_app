import { StyleSheet, Text, View } from 'react-native';
import { TeaRecommendationContent, TeaRecommendationId } from '@/lib/teaRecommendationContent';
import { getTeaProfileHighlights } from '@/lib/teaProfiles';
import { colors, spacing } from '@/lib/theme';

interface TeaBlendInfoCardProps {
  teaId: TeaRecommendationId;
  content: TeaRecommendationContent;
  title?: string;
  compact?: boolean;
}

export function TeaBlendInfoCard({
  teaId,
  content,
  title = '이 블렌드 더 보기',
  compact = false,
}: TeaBlendInfoCardProps) {
  const profileHighlights = getTeaProfileHighlights(teaId);

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.name}>{content.name}</Text>
      <Text style={styles.subtitle}>{content.subtitle}</Text>
      <Text style={styles.description}>{content.description}</Text>

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

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>블렌드 인상</Text>
        <Text style={styles.metaText}>{profileHighlights.join(' · ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>잘 맞는 시간대</Text>
        <Text style={styles.metaText}>{content.timings.join(' · ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>잘 맞는 상황</Text>
        <Text style={styles.metaText}>{content.situations.join(' · ')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactCard: {
    marginTop: spacing.md,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  description: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  keywordChip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keywordText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
  },
  metaText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  },
});
