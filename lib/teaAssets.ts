import { ImageSourcePropType } from 'react-native';
import { TeaRecommendationId } from '@/lib/teaRecommendationContent';

export interface TeaAssetMeta {
  imageSource?: ImageSourcePropType;
  imageUri?: string;
  initials: string;
  backgroundColor: string;
  accentColor: string;
}

export const teaAssets: Record<TeaRecommendationId, TeaAssetMeta> = {
  britishBlack: {
    imageSource: require('../assets/images/british_cup.webp'),
    initials: 'BB',
    backgroundColor: '#E9DFD8',
    accentColor: '#6C5147',
  },
  asianGold: {
    imageSource: require('../assets/images/asian_cup.webp'),
    initials: 'AG',
    backgroundColor: '#F2E7CB',
    accentColor: '#94784A',
  },
  hibiscusFruit: {
    imageSource: require('../assets/images/hibis_cup.webp'),
    initials: 'HF',
    backgroundColor: '#F5DDE4',
    accentColor: '#A75C72',
  },
  mintyChocolat: {
    imageSource: require('../assets/images/minty_cup.webp'),
    initials: 'MC',
    backgroundColor: '#DDECE7',
    accentColor: '#517269',
  },
};
