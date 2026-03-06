import { StyleSheet, Text, View } from 'react-native';
import { getTeaPresentationProfile } from '@/lib/teaProfiles';
import { TeaRecommendationId } from '@/lib/teaRecommendationContent';
import { colors, spacing } from '@/lib/theme';

interface TeaProfileMeterProps {
  teaId: TeaRecommendationId;
}

export function TeaProfileMeter({ teaId }: TeaProfileMeterProps) {
  const axes = getTeaPresentationProfile(teaId);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>티 프로파일</Text>
      {axes.map((axis) => (
        <View key={axis.label} style={styles.row}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>{axis.label}</Text>
            <Text style={styles.labelSub}>{axis.englishLabel}</Text>
          </View>
          <View style={styles.meter}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View
                key={`${axis.label}-${index}`}
                style={[
                  styles.meterBar,
                  index < axis.value && styles.meterBarActive,
                ]}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.md,
    letterSpacing: 0.1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  labelWrap: {
    width: 84,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.1,
  },
  labelSub: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
    letterSpacing: -0.1,
  },
  meter: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  meterBar: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  meterBarActive: {
    backgroundColor: colors.primary,
  },
});
