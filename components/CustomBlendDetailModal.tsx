import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createCustomBlendItemId } from '@/lib/teaBoxStorage';
import { CustomBlendOption, getCustomBlendVisualProfile } from '@/lib/customBlendEngine';
import { colors, spacing } from '@/lib/theme';
import { useStore } from '@/lib/store';

interface CustomBlendDetailModalProps {
  visible: boolean;
  option: CustomBlendOption | null;
  onClose: () => void;
}

export function CustomBlendDetailModal({
  visible,
  option,
  onClose,
}: CustomBlendDetailModalProps) {
  const { savedBlendItems, saveCustomBlendToBox } = useStore();
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setFeedbackMessage('');
    }
  }, [visible, option?.displayName]);

  const isSaved = useMemo(() => {
    if (!option) {
      return false;
    }

    return savedBlendItems.some((item) => item.id === createCustomBlendItemId(option));
  }, [option, savedBlendItems]);

  if (!option) {
    return null;
  }

  const visualProfile = getCustomBlendVisualProfile(option);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.handle} />

            <View style={styles.heroCard}>
              <View style={styles.headerRow}>
                <Text style={styles.eyebrow}>AI 블렌딩 제안</Text>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Text style={styles.closeText}>닫기</Text>
                </Pressable>
              </View>

              <Text style={styles.toneLabel}>{option.toneLabel}</Text>
              <Text style={styles.title}>{option.displayName}</Text>
              <Text style={styles.summary}>{option.summary}</Text>
              <Text style={styles.detail}>{option.detail}</Text>
            </View>

            <View style={styles.metaCard}>
              <Text style={styles.sectionTitle}>전체 재료</Text>
              <Text style={styles.ingredientText}>{option.ingredientNames.join(' · ')}</Text>
            </View>

            <View style={styles.metaCard}>
              <Text style={styles.sectionTitle}>핵심 태그</Text>
              <View style={styles.chipWrap}>
                {option.tags.map((tag) => (
                  <View key={tag} style={styles.chip}>
                    <Text style={styles.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.metaCard}>
              <Text style={styles.sectionTitle}>어울리는 흐름</Text>
              <Text style={styles.contextText}>{option.contextLine}</Text>

              <View style={styles.barGroup}>
                {visualProfile.bars.map((bar) => (
                  <View key={bar.key} style={styles.barRow}>
                    <Text style={styles.barLabel}>{bar.label}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${(bar.value / 5) * 100}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              style={[styles.saveButton, isSaved && styles.saveButtonSaved]}
              disabled={isSaved}
              onPress={async () => {
                const result = await saveCustomBlendToBox(option);
                if (!result.added) {
                  setFeedbackMessage('이미 담아둔 블렌드예요');
                  return;
                }

                if (__DEV__ && !result.synced) {
                  setFeedbackMessage('블렌드함에 담았어요. Firestore 동기화는 보류됐어요.');
                  return;
                }

                setFeedbackMessage('블렌드함에 담았어요');
              }}
            >
              <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextSaved]}>
                {isSaved ? '이미 블렌드함에 있어요' : '블렌드함에 담기'}
              </Text>
            </Pressable>

            {feedbackMessage ? <Text style={styles.feedbackText}>{feedbackMessage}</Text> : null}
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
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.primaryLight + '12',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 0.2,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  toneLabel: {
    marginTop: spacing.md,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.1,
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  summary: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  detail: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  metaCard: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.sm,
    letterSpacing: 0.1,
  },
  ingredientText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  contextText: {
    fontSize: 14,
    color: colors.text,
    letterSpacing: -0.2,
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
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  saveButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonSaved: {
    backgroundColor: colors.primaryLight + '20',
  },
  saveButtonText: {
    color: colors.card,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  saveButtonTextSaved: {
    color: colors.primary,
  },
  feedbackText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
