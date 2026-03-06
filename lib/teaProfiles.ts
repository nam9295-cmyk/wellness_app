import { TeaRecommendationId } from '@/lib/teaRecommendationContent';

interface TeaProfileScores {
  caffeine: number;
  fruity: number;
  minty: number;
  floral: number;
  nutty: number;
  chocolatey: number;
  blackTea: number;
  citrus: number;
  refresh: number;
  cozy: number;
  dessert: number;
  nightFriendly: number;
}

interface TeaProfile {
  id: TeaRecommendationId;
  scores: TeaProfileScores;
}

export const teaProfiles: Record<TeaRecommendationId, TeaProfile> = {
  britishBlack: {
    id: 'britishBlack',
    scores: { caffeine: 7, fruity: 2, minty: 0, floral: 2, nutty: 7, chocolatey: 6, blackTea: 9, citrus: 5, refresh: 4, cozy: 8, dessert: 8, nightFriendly: 3 },
  },
  asianGold: {
    id: 'asianGold',
    scores: { caffeine: 5, fruity: 5, minty: 1, floral: 2, nutty: 4, chocolatey: 5, blackTea: 2, citrus: 6, refresh: 8, cozy: 5, dessert: 5, nightFriendly: 6 },
  },
  hibiscusFruit: {
    id: 'hibiscusFruit',
    scores: { caffeine: 3, fruity: 9, minty: 0, floral: 5, nutty: 1, chocolatey: 3, blackTea: 0, citrus: 8, refresh: 9, cozy: 3, dessert: 4, nightFriendly: 8 },
  },
  mintyChocolat: {
    id: 'mintyChocolat',
    scores: { caffeine: 6, fruity: 1, minty: 10, floral: 3, nutty: 2, chocolatey: 8, blackTea: 7, citrus: 1, refresh: 8, cozy: 6, dessert: 7, nightFriendly: 4 },
  },
};

const profileScoreLabels: Record<keyof TeaProfileScores, string> = {
  caffeine: '적당한 각성감',
  fruity: '과일감',
  minty: '민트감',
  floral: '플로럴 뉘앙스',
  nutty: '고소한 결',
  chocolatey: '카카오 뉘앙스',
  blackTea: '홍차 구조감',
  citrus: '시트러스 결',
  refresh: '산뜻함',
  cozy: '차분한 포근함',
  dessert: '디저트 무드',
  nightFriendly: '가벼운 밤 무드',
};

export function getTeaProfileHighlights(teaId: TeaRecommendationId, limit = 3): string[] {
  const scores = teaProfiles[teaId].scores;

  return (Object.entries(scores) as Array<[keyof TeaProfileScores, number]>)
    .filter(([, score]) => score > 0)
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([key]) => profileScoreLabels[key]);
}
