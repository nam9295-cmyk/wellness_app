import {
  cWaterTeaIds,
  cWaterTeaMetadata,
  CWaterTeaFamily,
  CWaterTeaId,
  CWaterTeaMetadata,
  CWaterTeaMoodTag,
  CWaterTeaTimeTag,
} from '@/lib/cwaterTeaMetadata';
import { cWaterPairingRules, CWaterPairingRule } from '@/lib/cwaterPairingRules';

export interface CWaterBlendContext {
  preferredTags?: CWaterTeaMoodTag[];
  preferredTimes?: CWaterTeaTimeTag[];
  preferredFamilies?: CWaterTeaFamily[];
  maxResults?: number;
}

export interface CWaterBlendResult {
  id: string;
  teaIds: CWaterTeaId[];
  teas: CWaterTeaMetadata[];
  displayName: string;
  summary: string;
  detail: string;
  recommendationScore: number;
  harmonyScore: number;
  conflictScore: number;
  matchedRuleIds: string[];
  matchedNotes: string[];
  dominantTags: CWaterTeaMoodTag[];
}

export interface CWaterBlendVisualProfile {
  toneLabel: string;
  contextLine: string;
  ingredientNames: string[];
  tags: string[];
  bars: Array<{
    key: 'brightness' | 'body' | 'softness';
    label: string;
    value: number;
  }>;
}

interface CWaterBlendScore {
  recommendationScore: number;
  harmonyScore: number;
  conflictScore: number;
  matchedRuleIds: string[];
  matchedNotes: string[];
}

const pairNameMap: Partial<Record<string, string>> = {
  'classicBlack:earlGreyBlack': '노블 베르가못',
  'classicBlack:peachBlack': '피치 시그널',
  'classicBlack:lycheeBlack': '리치 노블',
  'earlGreyBlack:peachBlack': '베르가못 피치',
  'earlGreyBlack:lycheeBlack': '클래식 리치',
  'peachBlack:lycheeBlack': '로지 프루트',
  'classicOolong:peachOolong': '소프트 피치',
  'classicOolong:lycheeOolong': '클린 리치',
  'peachOolong:lycheeOolong': '에어리 리치',
  'classicOolong:citrusRooibos': '세레인 시트러스',
  'classicOolong:mintHerbal': '클린 브리즈',
  'citrusRooibos:mintHerbal': '민트 브리즈',
  'citrusRooibos:hibiscusFruit': '루비 제스트',
  'hibiscusFruit:mintHerbal': '클리어 루비',
  'hibiscusFruit:lycheeOolong': '플로라 루비',
  'hibiscusFruit:peachOolong': '피치 루비',
};

const summaryLeadByTag: Partial<Record<CWaterTeaMoodTag, string>> = {
  bright: '밝고 산뜻한 흐름이 먼저 들어옵니다.',
  soft: '부드럽고 편안한 결로 이어지는 조합입니다.',
  deep: '깊이감 있는 바디와 구조가 중심을 잡아줍니다.',
  focus: '또렷한 결이 살아 있어 낮 시간대에 잘 맞습니다.',
  juicy: '과일감이 살아나서 가볍게 기분을 전환하기 좋습니다.',
  calm: '자극 없이 차분하게 정돈되는 무드가 강합니다.',
  clean: '깔끔하게 정리되는 인상이 또렷합니다.',
  citrus: '시트러스 결이 선명하게 살아나는 타입입니다.',
  floral: '화사한 향이 가볍게 올라오는 조합입니다.',
  mint: '민트감이 맑고 시원하게 열리는 타입입니다.',
  daily: '매일 부담 없이 마시기 좋은 방향입니다.',
  cozy: '따뜻하고 포근한 무드가 안정적으로 이어집니다.',
};

const detailTailByFamily: Partial<Record<CWaterTeaFamily, string>> = {
  black: '블랙티의 구조를 유지하면서 확장하기 좋은 페어입니다.',
  blackBlend: '블랙티 블렌드 특유의 향과 바디를 더 풍성하게 엮어줍니다.',
  oolong: '우롱의 맑은 구조를 해치지 않고 결을 더해줍니다.',
  oolongBlend: '가벼운 우롱 베이스를 중심으로 향과 과일감을 겹치기 좋습니다.',
  rooibos: '카페인 부담 없이 부드러운 흐름을 만들기 좋습니다.',
  rooibosBlend: '루이보스의 부드러움을 살리며 포인트를 더하기 좋습니다.',
  fruit: '밝은 과일감 중심으로 무드를 세우는 데 적합합니다.',
  herbal: '허브 계열의 전환감과 정돈감을 함께 느끼기 좋습니다.',
};

const nameLeadByTag: Partial<Record<CWaterTeaMoodTag, string[]>> = {
  bright: ['브라이트', '에어리', '클리어'],
  soft: ['소프트', '벨벳', '젠틀'],
  deep: ['딥', '노블', '앰버'],
  focus: ['포커스', '샤프', '노블'],
  juicy: ['쥬시', '리치', '듀'],
  calm: ['세레인', '퀘이엇', '밸런스'],
  clean: ['클린', '퓨어', '프레시'],
  citrus: ['시트러스', '제스트', '브리즈'],
  floral: ['플로라', '블룸', '페탈'],
  mint: ['민트', '쿨', '브리즈'],
  daily: ['데일리', '플레인', '이븐'],
  cozy: ['코지', '웜', '멜로우'],
};

const nameTailBySignature: Record<string, string[]> = {
  'black:black': ['노트', '하모니', '리듬'],
  'black:oolong': ['플로우', '시그널', '하모니'],
  'black:fruit': ['루프', '웨이브', '노트'],
  'black:herbal': ['브리즈', '하모니', '플로우'],
  'black:rooibos': ['밸런스', '무드', '노트'],
  'oolong:oolong': ['플로우', '듀오', '리듬'],
  'fruit:oolong': ['웨이브', '플로우', '하모니'],
  'herbal:oolong': ['브리즈', '노트', '시그널'],
  'fruit:fruit': ['스플래시', '듀오', '무드'],
  'fruit:herbal': ['브리즈', '제스트', '웨이브'],
  'fruit:rooibos': ['하모니', '루프', '무드'],
  'herbal:rooibos': ['플로우', '밸런스', '브리즈'],
  'rooibos:rooibos': ['밸런스', '하모니', '포인트'],
  'herbal:herbal': ['브리즈', '이븐', '하모니'],
};

const summaryOpeningsByTag: Partial<Record<CWaterTeaMoodTag, string[]>> = {
  bright: ['맑고 환한 결이 먼저 들어옵니다.', '가볍게 시야를 열어주는 인상이 살아납니다.'],
  soft: ['부드럽고 편안한 결이 중심을 잡아줍니다.', '유연하고 매끈한 흐름이 자연스럽게 이어집니다.'],
  deep: ['깊이감 있는 바디가 중심을 단단히 잡아줍니다.', '차분한 밀도가 먼저 깔리는 타입입니다.'],
  focus: ['또렷한 결이 살아 있어 집중 흐름에 잘 맞습니다.', '정돈된 구조감이 분명하게 남는 조합입니다.'],
  juicy: ['과일감이 밝게 번지며 분위기를 환기해줍니다.', '가볍고 생기 있는 인상이 먼저 살아납니다.'],
  calm: ['차분하게 리듬을 낮추고 싶을 때 잘 어울립니다.', '자극 없이 정리되는 무드가 안정적으로 이어집니다.'],
  clean: ['깔끔하게 흐름을 정돈하는 인상이 선명합니다.', '입안에 남는 결이 가볍고 깨끗합니다.'],
  citrus: ['시트러스 결이 선명하게 살아나는 방향입니다.', '산뜻한 전환감이 또렷하게 남는 타입입니다.'],
  floral: ['화사한 향이 가볍게 열리며 분위기를 만듭니다.', '플로럴한 결이 부드럽게 퍼지는 조합입니다.'],
  mint: ['민트 특유의 환한 전환감이 빠르게 올라옵니다.', '시원한 결이 짧고 깔끔하게 정리됩니다.'],
  daily: ['매일 부담 없이 고르기 좋은 균형형 조합입니다.', '어느 한쪽으로 치우치지 않는 데일리 흐름입니다.'],
  cozy: ['포근한 온기가 차분하게 이어지는 타입입니다.', '부드러운 안정감이 오래 남는 조합입니다.'],
};

const pairingMoodBySignature: Record<string, string[]> = {
  'black:black': ['블랙티의 구조를 유지하면서 향의 결을 더해줍니다.', '탄탄한 베이스 위에 클래식한 포인트가 겹쳐집니다.'],
  'black:oolong': ['또렷함과 맑은 결이 함께 올라오는 밸런스가 좋습니다.', '블랙의 구조감과 우롱의 정돈감이 자연스럽게 만납니다.'],
  'black:fruit': ['블랙 베이스 위에 과일감이 얹혀 표정이 더 밝아집니다.', '차분한 구조 안에 프루티한 포인트가 살아납니다.'],
  'black:herbal': ['구조감 위에 전환감이 더해져 표정이 더 또렷해집니다.', '단정한 베이스에 허브의 깨끗한 결이 얹힙니다.'],
  'oolong:oolong': ['우롱 특유의 맑은 흐름이 더 입체적으로 살아납니다.', '가벼운 구조 안에서 향의 결이 겹쳐지는 조합입니다.'],
  'fruit:oolong': ['과일감과 우롱의 정돈감이 함께 읽혀 가볍게 이어집니다.', '맑은 베이스 위에 프루티한 표정이 산뜻하게 얹힙니다.'],
  'herbal:oolong': ['정리감과 전환감이 함께 있어 오후 흐름에 잘 맞습니다.', '허브의 가벼움이 우롱의 결을 더 또렷하게 보이게 합니다.'],
  'fruit:fruit': ['과일 계열의 개성이 겹치며 생기 있는 무드를 만듭니다.', '밝고 화사한 결을 중심으로 기분 전환이 쉬운 조합입니다.'],
  'fruit:herbal': ['과일감과 허브감이 맞물리며 가볍게 시야를 열어줍니다.', '프루티한 표정 위에 허브의 정돈감이 겹칩니다.'],
  'fruit:rooibos': ['부드러운 베이스 위에 과일감이 얹혀 편안하게 읽힙니다.', '루이보스의 온기와 과일감이 부드럽게 연결됩니다.'],
  'herbal:rooibos': ['자극 없이 부드럽고 깨끗하게 이어지는 타입입니다.', '루이보스의 편안함 위에 허브의 전환감이 얹힙니다.'],
  'rooibos:rooibos': ['루이보스 특유의 부드러움이 더 길게 이어집니다.', '카페인 부담 없이 차분한 리듬을 만들기 좋습니다.'],
  'herbal:herbal': ['허브 계열의 깨끗한 결이 한층 또렷해집니다.', '가볍고 맑은 무드가 자연스럽게 이어지는 조합입니다.'],
};

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickByHash<T>(items: T[], seed: string, fallback: T) {
  if (!items.length) {
    return fallback;
  }
  return items[hashString(seed) % items.length];
}

function getSignatureKey(teas: CWaterTeaMetadata[]) {
  return [teas[0].baseLeaf, teas[1].baseLeaf].sort().join(':');
}

function getTimeLine(teas: CWaterTeaMetadata[]) {
  const sharedTimes = teas[0].timeTags.filter((time) => teas[1].timeTags.includes(time));
  const targetTime = sharedTimes[0] ?? teas[0].timeTags[0] ?? teas[1].timeTags[0] ?? 'daily';

  return targetTime === 'morning'
    ? '아침 리듬을 차분하게 열고 싶을 때 잘 어울려요.'
    : targetTime === 'afternoon'
      ? '오후 흐름을 매끈하게 이어갈 때 선택하기 좋습니다.'
      : targetTime === 'evening'
        ? '저녁 무드로 전환할 때 부담 없이 이어가기 좋습니다.'
        : targetTime === 'lateNight'
          ? '늦은 시간에도 가볍게 이어가기 좋은 방향입니다.'
          : '하루 어느 구간에서도 무리 없이 고르기 좋습니다.';
}

function makePairKey(leftId: CWaterTeaId, rightId: CWaterTeaId) {
  return [leftId, rightId].sort().join(':');
}

function getDominantTags(teas: CWaterTeaMetadata[]) {
  const tagCounts = new Map<CWaterTeaMoodTag, number>();
  teas.forEach((tea) => {
    tea.moodTags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    });
  });

  return [...tagCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

function matchesRule(rule: CWaterPairingRule, teas: CWaterTeaMetadata[]) {
  const [left, right] = teas;
  const tags = new Set([...left.moodTags, ...right.moodTags]);
  const sharedPairingGroup = left.pairingGroups.some((group) => right.pairingGroups.includes(group));

  if (rule.match.teaIds) {
    const target = [...rule.match.teaIds].sort().join(':');
    if (makePairKey(left.id, right.id) !== target) {
      return false;
    }
  }

  if (rule.match.familyPair) {
    const familyKey = [left.family, right.family].sort().join(':');
    const ruleFamilyKey = [...rule.match.familyPair].sort().join(':');
    if (familyKey !== ruleFamilyKey) {
      return false;
    }
  }

  if (rule.match.sameFamily && left.family !== right.family) {
    return false;
  }

  if (rule.match.samePairingGroup && !sharedPairingGroup) {
    return false;
  }

  if (rule.match.allTags && !rule.match.allTags.every((tag) => tags.has(tag))) {
    return false;
  }

  if (rule.match.anyTags && !rule.match.anyTags.some((tag) => tags.has(tag))) {
    return false;
  }

  return true;
}

function scoreTeaContext(tea: CWaterTeaMetadata, context: CWaterBlendContext) {
  let score = 0;

  if (context.preferredTags?.length) {
    score += context.preferredTags.filter((tag) => tea.moodTags.includes(tag)).length * 1.4;
  }

  if (context.preferredTimes?.length) {
    score += context.preferredTimes.filter((time) => tea.timeTags.includes(time)).length * 1.1;
  }

  if (context.preferredFamilies?.length && context.preferredFamilies.includes(tea.family)) {
    score += 1.2;
  }

  return score;
}

function scoreBlend(teas: CWaterTeaMetadata[], context: CWaterBlendContext): CWaterBlendScore {
  const baseScore = teas.reduce((total, tea) => total + scoreTeaContext(tea, context), 0);
  const score: CWaterBlendScore = {
    recommendationScore: baseScore,
    harmonyScore: 0,
    conflictScore: 0,
    matchedRuleIds: [],
    matchedNotes: [],
  };

  cWaterPairingRules.forEach((rule) => {
    if (!matchesRule(rule, teas)) {
      return;
    }

    score.recommendationScore += rule.effect.recommendationDelta;
    score.harmonyScore += rule.effect.harmonyDelta;
    score.conflictScore += rule.effect.conflictDelta;
    score.matchedRuleIds.push(rule.id);
    score.matchedNotes.push(rule.effect.note);
  });

  if (teas[0].family === teas[1].family) {
    score.recommendationScore += 0.6;
    score.harmonyScore += 0.6;
  }

  return score;
}

function buildDisplayName(teas: CWaterTeaMetadata[], dominantTags: CWaterTeaMoodTag[]) {
  const mappedName = pairNameMap[makePairKey(teas[0].id, teas[1].id)];
  if (mappedName) {
    return mappedName;
  }

  const pairKey = makePairKey(teas[0].id, teas[1].id);
  const leadTag = dominantTags[0] ?? 'daily';
  const signatureKey = getSignatureKey(teas);
  const leadWord = pickByHash(nameLeadByTag[leadTag] ?? ['이븐'], pairKey, '이븐');
  const tailWord = pickByHash(
    nameTailBySignature[signatureKey] ?? ['하모니', '플로우', '노트'],
    `${pairKey}:tail`,
    '하모니',
  );

  return `${leadWord} ${tailWord}`;
}

function buildSummary(teas: CWaterTeaMetadata[], dominantTags: CWaterTeaMoodTag[]) {
  const pairKey = makePairKey(teas[0].id, teas[1].id);
  const leadTag = dominantTags[0] ?? 'daily';
  const opening = pickByHash(
    summaryOpeningsByTag[leadTag] ?? ['균형감 있게 이어지는 조합입니다.'],
    `${pairKey}:summary:opening`,
    '균형감 있게 이어지는 조합입니다.',
  );
  const timeLine = getTimeLine(teas);
  const pairingLine = pickByHash(
    pairingMoodBySignature[getSignatureKey(teas)] ?? ['두 결이 무리 없이 이어집니다.'],
    `${pairKey}:summary:pairing`,
    '두 결이 무리 없이 이어집니다.',
  );
  const variant = hashString(`${pairKey}:summary`) % 3;

  if (variant === 0) {
    return `${opening} ${pairingLine}`;
  }

  if (variant === 1) {
    return `${pairingLine} ${timeLine}`;
  }

  return `${opening} ${timeLine}`;
}

function buildDetail(teas: CWaterTeaMetadata[], matchedNotes: string[], dominantTags: CWaterTeaMoodTag[]) {
  const pairKey = makePairKey(teas[0].id, teas[1].id);
  const leadTag = dominantTags[0] ?? 'daily';
  const head = pickByHash(
    summaryOpeningsByTag[leadTag] ?? ['정돈된 흐름으로 읽히는 조합입니다.'],
    `${pairKey}:detail:head`,
    '정돈된 흐름으로 읽히는 조합입니다.',
  );
  const pairingNote = matchedNotes[0] ?? pickByHash(
    pairingMoodBySignature[getSignatureKey(teas)] ?? ['서로 다른 결을 무리 없이 잇는 데 적합합니다.'],
    `${pairKey}:detail:pairing`,
    '서로 다른 결을 무리 없이 잇는 데 적합합니다.',
  );
  const longestNoteTea = teas[0].noteLine.length >= teas[1].noteLine.length ? teas[0] : teas[1];
  const supportingTea = longestNoteTea.id === teas[0].id ? teas[1] : teas[0];
  const familyTail = detailTailByFamily[teas[0].family] ?? '서로 다른 결을 무리 없이 잇는 데 적합합니다.';
  const timeLine = getTimeLine(teas);
  const variant = hashString(`${pairKey}:detail`) % 3;

  if (variant === 0) {
    return `${head} ${longestNoteTea.noteLine}을 중심으로, ${supportingTea.displayName}의 결이 부드럽게 겹쳐집니다. ${timeLine}`;
  }

  if (variant === 1) {
    return `${pairingNote} ${familyTail} ${timeLine}`;
  }

  return `${head} ${pairingNote} ${supportingTea.noteLine}이 뒤에서 표정을 더해줍니다.`;
}

function buildCandidateResult(leftTea: CWaterTeaMetadata, rightTea: CWaterTeaMetadata, context: CWaterBlendContext): CWaterBlendResult {
  const teas = [leftTea, rightTea];
  const score = scoreBlend(teas, context);
  const dominantTags = getDominantTags(teas);

  return {
    id: makePairKey(leftTea.id, rightTea.id),
    teaIds: [leftTea.id, rightTea.id],
    teas,
    displayName: buildDisplayName(teas, dominantTags),
    summary: buildSummary(teas, dominantTags),
    detail: buildDetail(teas, score.matchedNotes, dominantTags),
    recommendationScore: Number(score.recommendationScore.toFixed(1)),
    harmonyScore: Number(score.harmonyScore.toFixed(1)),
    conflictScore: Number(score.conflictScore.toFixed(1)),
    matchedRuleIds: score.matchedRuleIds,
    matchedNotes: score.matchedNotes,
    dominantTags,
  };
}

export function generateCWaterBlendCandidates(context: CWaterBlendContext = {}) {
  const results: CWaterBlendResult[] = [];

  for (let leftIndex = 0; leftIndex < cWaterTeaIds.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < cWaterTeaIds.length; rightIndex += 1) {
      const leftTea = cWaterTeaMetadata[cWaterTeaIds[leftIndex]];
      const rightTea = cWaterTeaMetadata[cWaterTeaIds[rightIndex]];
      results.push(buildCandidateResult(leftTea, rightTea, context));
    }
  }

  const sortedResults = results.sort((left, right) => {
    if (right.recommendationScore !== left.recommendationScore) {
      return right.recommendationScore - left.recommendationScore;
    }

    if (right.harmonyScore !== left.harmonyScore) {
      return right.harmonyScore - left.harmonyScore;
    }

    return left.conflictScore - right.conflictScore;
  });

  const nameCounts = new Map<string, number>();
  return sortedResults.map((result) => {
    const count = nameCounts.get(result.displayName) ?? 0;
    nameCounts.set(result.displayName, count + 1);

    if (count === 0) {
      return result;
    }

    const qualifier = result.teas.map((tea) => tea.displayName.replace(/\s+/g, '')).join(' · ');
    return {
      ...result,
      displayName: `${result.displayName} · ${qualifier}`,
    };
  });
}

export function getTopCWaterBlendResults(context: CWaterBlendContext = {}) {
  const maxResults = context.maxResults ?? 3;
  return generateCWaterBlendCandidates(context).slice(0, maxResults);
}

export function getCWaterBlendVisualProfile(result: CWaterBlendResult): CWaterBlendVisualProfile {
  const average = (values: number[]) =>
    Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
  const brightness = average(result.teas.map((tea) => tea.brightness));
  const body = average(result.teas.map((tea) => tea.body));
  const softness = average(result.teas.map((tea) => tea.softness));
  const leadTag = result.dominantTags[0] ?? 'daily';
  const toneLabel =
    leadTag === 'bright' || leadTag === 'citrus' ? '브라이트 페어' :
    leadTag === 'soft' || leadTag === 'calm' ? '소프트 페어' :
    leadTag === 'focus' || leadTag === 'deep' ? '포커스 페어' :
    leadTag === 'clean' || leadTag === 'mint' ? '클린 페어' :
    '데일리 페어';

  return {
    toneLabel,
    contextLine: result.matchedNotes[0] ?? result.teas.map((tea) => tea.noteLine).join(' · '),
    ingredientNames: result.teas.map((tea) => tea.displayName),
    tags: result.dominantTags,
    bars: [
      { key: 'brightness', label: '산뜻함', value: brightness },
      { key: 'body', label: '바디', value: body },
      { key: 'softness', label: '부드러움', value: softness },
    ],
  };
}
