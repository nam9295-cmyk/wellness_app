export type CWaterTeaFamily =
  | 'black'
  | 'blackBlend'
  | 'oolong'
  | 'oolongBlend'
  | 'rooibos'
  | 'rooibosBlend'
  | 'fruit'
  | 'herbal';

export type CWaterTeaMoodTag =
  | 'bright'
  | 'soft'
  | 'deep'
  | 'focus'
  | 'juicy'
  | 'calm'
  | 'clean'
  | 'citrus'
  | 'floral'
  | 'mint'
  | 'daily'
  | 'cozy';

export type CWaterTeaTimeTag =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'lateNight'
  | 'daily';

export type CWaterTeaId =
  | 'classicBlack'
  | 'earlGreyBlack'
  | 'peachBlack'
  | 'lycheeBlack'
  | 'classicOolong'
  | 'peachOolong'
  | 'lycheeOolong'
  | 'citrusRooibos'
  | 'hibiscusFruit'
  | 'mintHerbal';

export interface CWaterTeaMetadata {
  id: CWaterTeaId;
  name: string;
  displayName: string;
  family: CWaterTeaFamily;
  baseLeaf: 'black' | 'oolong' | 'rooibos' | 'fruit' | 'herbal';
  noteLine: string;
  moodTags: CWaterTeaMoodTag[];
  timeTags: CWaterTeaTimeTag[];
  body: 1 | 2 | 3 | 4 | 5;
  brightness: 1 | 2 | 3 | 4 | 5;
  softness: 1 | 2 | 3 | 4 | 5;
  caffeineLevel: 0 | 1 | 2 | 3;
  pairingGroups: string[];
}

export const cWaterTeaMetadata: Record<CWaterTeaId, CWaterTeaMetadata> = {
  classicBlack: {
    id: 'classicBlack',
    name: '클래식 홍차',
    displayName: '클래식 블랙',
    family: 'black',
    baseLeaf: 'black',
    noteLine: '단정한 구조감과 또렷한 블랙티 결',
    moodTags: ['deep', 'focus', 'daily'],
    timeTags: ['morning', 'afternoon'],
    body: 4,
    brightness: 2,
    softness: 2,
    caffeineLevel: 3,
    pairingGroups: ['black_core', 'classic'],
  },
  earlGreyBlack: {
    id: 'earlGreyBlack',
    name: '얼그레이 홍차',
    displayName: '얼그레이 블랙',
    family: 'blackBlend',
    baseLeaf: 'black',
    noteLine: '베르가못이 얹힌 선명한 클래식 무드',
    moodTags: ['focus', 'citrus', 'deep', 'daily'],
    timeTags: ['morning', 'afternoon'],
    body: 4,
    brightness: 3,
    softness: 2,
    caffeineLevel: 3,
    pairingGroups: ['black_core', 'bergamot', 'classic'],
  },
  peachBlack: {
    id: 'peachBlack',
    name: '피치 홍차',
    displayName: '피치 블랙',
    family: 'blackBlend',
    baseLeaf: 'black',
    noteLine: '블랙티 위에 달콤한 과일감이 얹힌 흐름',
    moodTags: ['juicy', 'soft', 'daily'],
    timeTags: ['afternoon', 'daily'],
    body: 3,
    brightness: 3,
    softness: 4,
    caffeineLevel: 2,
    pairingGroups: ['black_fruit', 'stone_fruit'],
  },
  lycheeBlack: {
    id: 'lycheeBlack',
    name: '리치 홍차',
    displayName: '리치 블랙',
    family: 'blackBlend',
    baseLeaf: 'black',
    noteLine: '화사한 향과 붉은 과일 무드가 살아나는 블랙티',
    moodTags: ['juicy', 'floral', 'bright'],
    timeTags: ['afternoon', 'daily'],
    body: 3,
    brightness: 4,
    softness: 3,
    caffeineLevel: 2,
    pairingGroups: ['black_fruit', 'tropical_fruit'],
  },
  classicOolong: {
    id: 'classicOolong',
    name: '우롱차',
    displayName: '클래식 우롱',
    family: 'oolong',
    baseLeaf: 'oolong',
    noteLine: '맑고 정돈된 결이 이어지는 우롱 베이스',
    moodTags: ['clean', 'daily', 'focus'],
    timeTags: ['afternoon', 'evening', 'daily'],
    body: 3,
    brightness: 3,
    softness: 3,
    caffeineLevel: 2,
    pairingGroups: ['oolong_core', 'clean'],
  },
  peachOolong: {
    id: 'peachOolong',
    name: '피치우롱',
    displayName: '피치 우롱',
    family: 'oolongBlend',
    baseLeaf: 'oolong',
    noteLine: '가볍고 산뜻한 과일감이 올라오는 우롱 블렌드',
    moodTags: ['bright', 'juicy', 'clean', 'daily'],
    timeTags: ['afternoon', 'daily'],
    body: 2,
    brightness: 4,
    softness: 4,
    caffeineLevel: 2,
    pairingGroups: ['oolong_fruit', 'stone_fruit'],
  },
  lycheeOolong: {
    id: 'lycheeOolong',
    name: '리치우롱',
    displayName: '리치 우롱',
    family: 'oolongBlend',
    baseLeaf: 'oolong',
    noteLine: '우롱의 가벼운 구조 위에 화사한 리치 향이 도는 타입',
    moodTags: ['bright', 'floral', 'juicy', 'clean'],
    timeTags: ['afternoon', 'evening'],
    body: 2,
    brightness: 4,
    softness: 3,
    caffeineLevel: 2,
    pairingGroups: ['oolong_fruit', 'tropical_fruit'],
  },
  citrusRooibos: {
    id: 'citrusRooibos',
    name: '시트러스 루이보스',
    displayName: '시트러스 루이보스',
    family: 'rooibosBlend',
    baseLeaf: 'rooibos',
    noteLine: '부드러운 루이보스에 가벼운 시트러스가 얹힌 흐름',
    moodTags: ['soft', 'calm', 'citrus', 'daily'],
    timeTags: ['evening', 'lateNight', 'daily'],
    body: 3,
    brightness: 3,
    softness: 5,
    caffeineLevel: 0,
    pairingGroups: ['rooibos_soft', 'citrus'],
  },
  hibiscusFruit: {
    id: 'hibiscusFruit',
    name: '히비스커스 프룻',
    displayName: '히비스커스 프룻',
    family: 'fruit',
    baseLeaf: 'fruit',
    noteLine: '선명하고 톡 트이는 프루티 무드의 허브 타입',
    moodTags: ['bright', 'juicy', 'citrus', 'clean'],
    timeTags: ['afternoon', 'evening', 'lateNight'],
    body: 2,
    brightness: 5,
    softness: 2,
    caffeineLevel: 0,
    pairingGroups: ['fruit_bright', 'berry_citrus'],
  },
  mintHerbal: {
    id: 'mintHerbal',
    name: '민트 허브',
    displayName: '민트 허브',
    family: 'herbal',
    baseLeaf: 'herbal',
    noteLine: '가볍고 시원한 전환감이 먼저 오는 허브 타입',
    moodTags: ['mint', 'clean', 'bright', 'calm'],
    timeTags: ['afternoon', 'evening', 'lateNight'],
    body: 1,
    brightness: 4,
    softness: 3,
    caffeineLevel: 0,
    pairingGroups: ['mint_clean', 'refresh'],
  },
};

export const cWaterTeaIds = Object.keys(cWaterTeaMetadata) as CWaterTeaId[];
