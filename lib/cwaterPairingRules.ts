import { CWaterTeaFamily, CWaterTeaId, CWaterTeaMoodTag } from '@/lib/cwaterTeaMetadata';

export type CWaterPairingRuleKind = 'allow' | 'boost' | 'conflict';

export interface CWaterPairingRuleMatch {
  teaIds?: CWaterTeaId[];
  familyPair?: [CWaterTeaFamily, CWaterTeaFamily];
  sameFamily?: boolean;
  samePairingGroup?: boolean;
  allTags?: CWaterTeaMoodTag[];
  anyTags?: CWaterTeaMoodTag[];
}

export interface CWaterPairingRuleEffect {
  allow: boolean;
  recommendationDelta: number;
  harmonyDelta: number;
  conflictDelta: number;
  note: string;
}

export interface CWaterPairingRule {
  id: string;
  label: string;
  kind: CWaterPairingRuleKind;
  match: CWaterPairingRuleMatch;
  effect: CWaterPairingRuleEffect;
}

export const cWaterPairingRules: CWaterPairingRule[] = [
  {
    id: 'allow-same-black-family',
    label: '홍차 계열끼리 허용',
    kind: 'allow',
    match: {
      familyPair: ['black', 'blackBlend'],
    },
    effect: {
      allow: true,
      recommendationDelta: 1,
      harmonyDelta: 2,
      conflictDelta: 0,
      note: '클래식한 블랙티 결 안에서 자연스럽게 확장됩니다.',
    },
  },
  {
    id: 'allow-same-oolong-family',
    label: '우롱 계열끼리 허용',
    kind: 'allow',
    match: {
      familyPair: ['oolong', 'oolongBlend'],
    },
    effect: {
      allow: true,
      recommendationDelta: 1,
      harmonyDelta: 2,
      conflictDelta: 0,
      note: '우롱 베이스 안에서 맑은 구조감을 유지하기 좋습니다.',
    },
  },
  {
    id: 'boost-peach-lychee-oolong',
    label: '피치우롱 + 리치우롱',
    kind: 'boost',
    match: {
      teaIds: ['peachOolong', 'lycheeOolong'],
    },
    effect: {
      allow: true,
      recommendationDelta: 3,
      harmonyDelta: 3,
      conflictDelta: 0,
      note: '화사한 과일향과 맑은 우롱 결이 잘 이어집니다.',
    },
  },
  {
    id: 'boost-black-fruit-lift',
    label: '블랙티 + 과일 계열',
    kind: 'boost',
    match: {
      familyPair: ['blackBlend', 'fruit'],
    },
    effect: {
      allow: true,
      recommendationDelta: 2,
      harmonyDelta: 1,
      conflictDelta: 0,
      note: '깊이감 있는 바디 위에 밝은 과일 포인트를 더하기 좋습니다.',
    },
  },
  {
    id: 'boost-calm-soft-pair',
    label: 'calm + soft 조합',
    kind: 'boost',
    match: {
      allTags: ['calm', 'soft'],
    },
    effect: {
      allow: true,
      recommendationDelta: 2,
      harmonyDelta: 2,
      conflictDelta: 0,
      note: '저녁용 블렌드나 부드러운 데일리 흐름에 잘 맞습니다.',
    },
  },
  {
    id: 'boost-bright-clean-pair',
    label: 'bright + clean 조합',
    kind: 'boost',
    match: {
      allTags: ['bright', 'clean'],
    },
    effect: {
      allow: true,
      recommendationDelta: 2,
      harmonyDelta: 1,
      conflictDelta: 0,
      note: '산뜻하고 정돈된 인상을 만들기 좋습니다.',
    },
  },
  {
    id: 'conflict-too-many-citrus',
    label: '시트러스 과밀',
    kind: 'conflict',
    match: {
      allTags: ['citrus', 'bright'],
    },
    effect: {
      allow: true,
      recommendationDelta: -1,
      harmonyDelta: -1,
      conflictDelta: 2,
      note: '밝은 인상은 좋지만 지나치면 결이 산만해질 수 있습니다.',
    },
  },
  {
    id: 'conflict-mint-vs-classic-black',
    label: '민트 + 클래식 홍차 충돌도 상승',
    kind: 'conflict',
    match: {
      teaIds: ['classicBlack', 'mintHerbal'],
    },
    effect: {
      allow: true,
      recommendationDelta: -2,
      harmonyDelta: -1,
      conflictDelta: 3,
      note: '클래식한 블랙티 구조와 민트 전환감이 충돌할 수 있습니다.',
    },
  },
  {
    id: 'boost-shared-pairing-group',
    label: '같은 pairing group 권장',
    kind: 'boost',
    match: {
      samePairingGroup: true,
    },
    effect: {
      allow: true,
      recommendationDelta: 2,
      harmonyDelta: 2,
      conflictDelta: 0,
      note: '같은 결 안에서 이어지는 조합으로 읽힐 가능성이 높습니다.',
    },
  },
];
