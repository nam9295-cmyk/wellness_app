import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TeaRecommendationResult } from '@/lib/teaRecommendationEngine';
import { colors, spacing } from '@/lib/theme';

interface TeaRecommendationDetailModalProps {
  visible: boolean;
  recommendation: TeaRecommendationResult;
  onClose: () => void;
}

export function TeaRecommendationDetailModal({
  visible,
  recommendation,
  onClose,
}: TeaRecommendationDetailModalProps) {
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
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{recommendation.content.name}</Text>
              <Text style={styles.subtitle}>{recommendation.content.subtitle}</Text>
            </View>

            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>

          <Text style={styles.description}>{recommendation.content.description}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>오늘 잘 맞는 이유</Text>
            <Text style={styles.bodyText}>{recommendation.reason}</Text>
            <Text style={styles.contextText}>{recommendation.contextLine}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>잘 맞는 시간대</Text>
            <Text style={styles.metaText}>{recommendation.content.timings.join(' · ')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>잘 맞는 상황</Text>
            <Text style={styles.metaText}>{recommendation.content.situations.join(' · ')}</Text>
          </View>

          {recommendation.secondaryContent ? (
            <View style={styles.secondaryCard}>
              <Text style={styles.secondaryLabel}>보조 후보</Text>
              <Text style={styles.secondaryName}>{recommendation.secondaryContent.name}</Text>
              <Text style={styles.secondarySubtitle}>{recommendation.secondaryContent.subtitle}</Text>
            </View>
          ) : null}
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
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
  section: {
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
  metaText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
  },
  secondaryCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  secondaryName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  secondarySubtitle: {
    fontSize: 14,
    color: colors.textLight,
    letterSpacing: -0.2,
  },
});
