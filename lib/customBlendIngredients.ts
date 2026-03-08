import { WellnessGoal } from '@/types';

export type CustomBlendToneTag =
  | 'refresh'
  | 'soft'
  | 'focus'
  | 'night'
  | 'citrus'
  | 'mint'
  | 'fruit'
  | 'cozy'
  | 'floral'
  | 'structure'
  | 'chocolaty'
  | 'clean'
  | 'daily';

export type CustomBlendIngredientId =
  | 'cacaoNib'
  | 'earlGreyBlackTea'
  | 'oolong'
  | 'rooibos'
  | 'hibiscus'
  | 'mint'
  | 'lemongrass'
  | 'orangePeel'
  | 'bergamot'
  | 'hazelnut'
  | 'rosehip'
  | 'raisin'
  | 'cornflower'
  | 'cacaoHusk'
  | 'lycheeFlavor'
  | 'grapefruitPeel'
  | 'lemonPeel'
  | 'peppermint'
  | 'appleChip'
  | 'cinnamon';

export interface CustomBlendIngredient {
  id: CustomBlendIngredientId;
  name: string;
  role: 'base' | 'tea' | 'herb' | 'fruit' | 'floral' | 'spice' | 'nut' | 'aroma';
  tags: CustomBlendToneTag[];
  preferredGoals?: WellnessGoal[];
  avoidLateNight?: boolean;
  notes: string[];
}

export const customBlendIngredients: Record<CustomBlendIngredientId, CustomBlendIngredient> = {
  cacaoNib: {
    id: 'cacaoNib',
    name: '카카오닙',
    role: 'base',
    tags: ['chocolaty', 'cozy', 'structure'],
    avoidLateNight: false,
    notes: ['깊이감', '카카오 결', '기본 베이스'],
  },
  earlGreyBlackTea: {
    id: 'earlGreyBlackTea',
    name: '얼그레이 홍차',
    role: 'tea',
    tags: ['focus', 'structure', 'daily', 'citrus'],
    preferredGoals: ['운동 루틴 유지', '피로 관리'],
    avoidLateNight: true,
    notes: ['또렷한 시작', '클래식', '집중감'],
  },
  oolong: {
    id: 'oolong',
    name: '우롱차',
    role: 'tea',
    tags: ['daily', 'structure', 'clean'],
    preferredGoals: ['식습관 관리', '피로 관리'],
    avoidLateNight: true,
    notes: ['균형감', '부드러운 구조감', '깔끔한 흐름'],
  },
  rooibos: {
    id: 'rooibos',
    name: '루이보스',
    role: 'tea',
    tags: ['soft', 'night', 'daily', 'cozy'],
    preferredGoals: ['수면 관리', '기분 관리'],
    notes: ['부드러움', '편안한 결', '데일리'],
  },
  hibiscus: {
    id: 'hibiscus',
    name: '히비스커스',
    role: 'herb',
    tags: ['refresh', 'fruit', 'citrus'],
    preferredGoals: ['기분 관리', '식습관 관리'],
    notes: ['선명한 산뜻함', '밝은 전환', '프루티'],
  },
  mint: {
    id: 'mint',
    name: '민트',
    role: 'herb',
    tags: ['refresh', 'mint', 'clean'],
    preferredGoals: ['식습관 관리', '기분 관리'],
    notes: ['상쾌한 결', '가벼운 전환', '클린'],
  },
  lemongrass: {
    id: 'lemongrass',
    name: '레몬그라스',
    role: 'herb',
    tags: ['refresh', 'citrus', 'clean', 'night'],
    preferredGoals: ['수면 관리', '기분 관리'],
    notes: ['가벼운 시트러스', '정돈감', '산뜻한 허브'],
  },
  orangePeel: {
    id: 'orangePeel',
    name: '오렌지필',
    role: 'fruit',
    tags: ['citrus', 'daily', 'cozy'],
    preferredGoals: ['기분 관리', '식습관 관리'],
    notes: ['달콤한 시트러스', '부드러운 과일감', '따뜻한 무드'],
  },
  bergamot: {
    id: 'bergamot',
    name: '베르가못',
    role: 'aroma',
    tags: ['citrus', 'focus', 'structure'],
    preferredGoals: ['피로 관리', '운동 루틴 유지'],
    avoidLateNight: true,
    notes: ['클래식한 향', '또렷한 인상', '상쾌한 끝맛'],
  },
  hazelnut: {
    id: 'hazelnut',
    name: '헤이즐넛',
    role: 'nut',
    tags: ['cozy', 'soft', 'chocolaty'],
    preferredGoals: ['기분 관리', '수면 관리'],
    notes: ['고소함', '부드러운 만족감', '따뜻한 여운'],
  },
  rosehip: {
    id: 'rosehip',
    name: '로즈힙',
    role: 'fruit',
    tags: ['fruit', 'refresh', 'citrus'],
    preferredGoals: ['기분 관리', '식습관 관리'],
    notes: ['가벼운 산미', '밝은 과일감', '리셋 무드'],
  },
  raisin: {
    id: 'raisin',
    name: '건포도',
    role: 'fruit',
    tags: ['soft', 'cozy', 'fruit'],
    preferredGoals: ['피로 관리', '기분 관리'],
    notes: ['진한 단맛 결', '차분한 과일감', '부드러운 무게감'],
  },
  cornflower: {
    id: 'cornflower',
    name: '수레국화',
    role: 'floral',
    tags: ['floral', 'daily', 'soft'],
    preferredGoals: ['기분 관리'],
    notes: ['은은한 꽃결', '가벼운 포인트', '정돈된 인상'],
  },
  cacaoHusk: {
    id: 'cacaoHusk',
    name: '카카오 허스크',
    role: 'herb',
    tags: ['chocolaty', 'cozy', 'soft'],
    preferredGoals: ['피로 관리', '기분 관리'],
    notes: ['카카오 향', '부드러운 깊이감', '매끈한 마무리'],
  },
  lycheeFlavor: {
    id: 'lycheeFlavor',
    name: '리치향',
    role: 'aroma',
    tags: ['fruit', 'refresh', 'floral'],
    preferredGoals: ['기분 관리'],
    notes: ['화사한 과일향', '가벼운 전환', '향 중심'],
  },
  grapefruitPeel: {
    id: 'grapefruitPeel',
    name: '자몽필',
    role: 'fruit',
    tags: ['citrus', 'refresh', 'clean'],
    preferredGoals: ['식습관 관리', '운동 루틴 유지'],
    notes: ['쌉쌀한 산뜻함', '클린한 마무리', '활기 있는 결'],
  },
  lemonPeel: {
    id: 'lemonPeel',
    name: '레몬필',
    role: 'fruit',
    tags: ['citrus', 'refresh', 'clean'],
    preferredGoals: ['식습관 관리', '기분 관리'],
    notes: ['선명한 시트러스', '가벼운 리셋', '맑은 마무리'],
  },
  peppermint: {
    id: 'peppermint',
    name: '페퍼민트',
    role: 'herb',
    tags: ['refresh', 'mint', 'clean', 'night'],
    preferredGoals: ['식습관 관리', '수면 관리'],
    notes: ['선명한 민트감', '쿨한 전환', '깔끔한 흐름'],
  },
  appleChip: {
    id: 'appleChip',
    name: '건조 사과칩',
    role: 'fruit',
    tags: ['fruit', 'soft', 'daily'],
    preferredGoals: ['기분 관리', '식습관 관리'],
    notes: ['부드러운 과일감', '친숙한 무드', '데일리 포인트'],
  },
  cinnamon: {
    id: 'cinnamon',
    name: '시나몬',
    role: 'spice',
    tags: ['cozy', 'structure', 'soft'],
    preferredGoals: ['피로 관리', '기분 관리'],
    notes: ['따뜻한 스파이스', '포근한 무드', '깊이감'],
  },
};

export const customBlendBaseIngredientId: CustomBlendIngredientId = 'cacaoNib';

export const customBlendCandidateIds = (Object.keys(customBlendIngredients) as CustomBlendIngredientId[]).filter(
  (ingredientId) => ingredientId !== customBlendBaseIngredientId
);

export interface CustomBlendRule {
  id: string;
  kind: 'ban' | 'penalty' | 'bonus';
  ingredientIds: CustomBlendIngredientId[];
  scoreDelta?: number;
  reason: string;
}

export const customBlendRules: CustomBlendRule[] = [
  {
    id: 'avoid-double-mint',
    kind: 'ban',
    ingredientIds: ['mint', 'peppermint'],
    reason: '민트 계열이 중복되면 결이 과하게 겹칩니다.',
  },
  {
    id: 'avoid-earlgrey-bergamot',
    kind: 'ban',
    ingredientIds: ['earlGreyBlackTea', 'bergamot'],
    reason: '얼그레이와 베르가못은 향 결이 중복됩니다.',
  },
  {
    id: 'citrus-overload',
    kind: 'penalty',
    ingredientIds: ['orangePeel', 'grapefruitPeel', 'lemonPeel'],
    scoreDelta: -4,
    reason: '시트러스가 과하면 균형이 깨질 수 있습니다.',
  },
  {
    id: 'soft-cacao-pair',
    kind: 'bonus',
    ingredientIds: ['cacaoHusk', 'hazelnut'],
    scoreDelta: 4,
    reason: '카카오 계열과 고소한 결이 자연스럽게 이어집니다.',
  },
  {
    id: 'fresh-citrus-pair',
    kind: 'bonus',
    ingredientIds: ['hibiscus', 'grapefruitPeel'],
    scoreDelta: 4,
    reason: '밝고 산뜻한 흐름이 잘 맞습니다.',
  },
  {
    id: 'gentle-night-pair',
    kind: 'bonus',
    ingredientIds: ['rooibos', 'lemongrass'],
    scoreDelta: 4,
    reason: '부드럽고 차분한 결이 잘 이어집니다.',
  },
];
