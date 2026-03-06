import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TeaBlendInfoCard } from '@/components/TeaBlendInfoCard';
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
              <Text style={styles.sectionLabel}>{reasonTitle}</Text>
              <Text style={styles.bodyText}>{recommendation.reason}</Text>
              <Text style={styles.contextText}>{recommendation.contextLine}</Text>
            </View>

            <TeaBlendInfoCard
              teaId={recommendation.teaId}
              content={recommendation.content}
              title="이 블렌드 더 보기"
            />

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
    paddingBottom: spacing.sm,
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
});
