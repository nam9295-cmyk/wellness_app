export type TeaRecommendationId = 'britishBlack' | 'asianGold' | 'hibiscusFruit' | 'mintyChocolat';

export interface TeaRecommendationContent {
  id: TeaRecommendationId;
  name: string;
  subtitle: string;
  description: string;
  flavorKeywords: string[];
  timings: string[];
  situations: string[];
}

export const teaRecommendationContent: Record<TeaRecommendationId, TeaRecommendationContent> = {
  britishBlack: {
    id: 'britishBlack',
    name: '브리티쉬 블랙',
    subtitle: '클래식한 깊이감',
    description: '홍차의 단단한 구조감이 차분하게 이어지는 클래식 무드의 블렌드예요.',
    flavorKeywords: ['깊은 홍차감', '카카오 결', '묵직한 여운', '클래식 무드'],
    timings: ['아침 시작', '늦은 오전'],
    situations: ['집중 루틴', '단정한 티 타임'],
  },
  asianGold: {
    id: 'asianGold',
    name: '아시안 골드',
    subtitle: '부드러운 이국적 균형감',
    description: '부드러운 바디감과 산뜻한 마무리가 함께 오는 균형형 블렌드예요.',
    flavorKeywords: ['부드러운 이국성', '허브-시트러스', '정돈된 바디감', '깔끔한 마무리'],
    timings: ['늦은 오전', '오후', '이른 저녁'],
    situations: ['데일리 루틴', '무겁지 않은 집중 시간'],
  },
  hibiscusFruit: {
    id: 'hibiscusFruit',
    name: '히비스커스 프룻',
    subtitle: '밝고 경쾌한 프루티 무드',
    description: '밝은 과일감과 산뜻한 전환감이 살아 있는 리프레시 타입의 블렌드예요.',
    flavorKeywords: ['선명한 과일감', '산뜻한 산미', '가벼운 바디', '클린 피니시'],
    timings: ['오후', '늦은 밤'],
    situations: ['기분 환기', '가벼운 리셋'],
  },
  mintyChocolat: {
    id: 'mintyChocolat',
    name: '민티 쇼콜라',
    subtitle: '상쾌함과 만족감의 대비',
    description: '민트의 상쾌함과 카카오의 부드러운 여운이 함께 오는 블렌드예요.',
    flavorKeywords: ['민트 리프레시', '카카오 여운', '선명한 대비', '깔끔한 마무리'],
    timings: ['식후', '오후', '이른 저녁'],
    situations: ['식후 전환', '디저트 무드 대체'],
  },
};
