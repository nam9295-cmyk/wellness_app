import { Image, StyleSheet, Text, View } from 'react-native';
import { teaAssets } from '@/lib/teaAssets';
import { TeaRecommendationId, teaRecommendationContent } from '@/lib/teaRecommendationContent';
import { colors } from '@/lib/theme';

interface TeaThumbnailProps {
  teaId: TeaRecommendationId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const thumbnailSizes = {
  sm: 64,
  md: 88,
  lg: 112,
  xl: 220,
} as const;

export function TeaThumbnail({ teaId, size = 'md' }: TeaThumbnailProps) {
  const asset = teaAssets[teaId];
  const tea = teaRecommendationContent[teaId];
  const dimension = thumbnailSizes[size];
  const hasImage = Boolean(asset.imageSource || asset.imageUri);

  return (
    <View
      style={[
        styles.frame,
        {
          width: dimension,
          height: dimension,
          borderRadius: size === 'xl' ? 28 : 20,
          backgroundColor: asset.backgroundColor,
          borderColor: asset.accentColor + '24',
        },
      ]}
    >
      {hasImage ? (
        <Image
          source={asset.imageSource ?? { uri: asset.imageUri }}
          resizeMode="cover"
          style={styles.image}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={[styles.initials, { color: asset.accentColor }]}>{asset.initials}</Text>
          <Text style={styles.placeholderName} numberOfLines={2}>
            {tea.name}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 6,
  },
  initials: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  placeholderName: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
