import { WellnessGoal, WellnessLog } from '@/types';
import { deriveTeaRecommendationContext, TeaRecommendationContext } from './teaRecommendationEngine';
import {
  customBlendBaseIngredientId,
  customBlendCandidateIds,
  customBlendIngredients,
  CustomBlendIngredientId,
  customBlendRules,
  CustomBlendToneTag,
} from './customBlendIngredients';

type TimeSlot = TeaRecommendationContext['timeSlot'];

interface CustomBlendInput {
  logs: WellnessLog[];
  userGoal?: WellnessGoal;
  now?: Date;
}

export interface CustomBlendOption {
  label: 'best' | 'refreshing' | 'soft';
  recommendationType: 'best' | 'fresh' | 'soft';
  displayName: string;
  title: string;
  toneLabel: string;
  ingredientIds: CustomBlendIngredientId[];
  ingredientNames: string[];
  score: number;
  summary: string;
  detail: string;
  tags: string[];
  reason: string;
  contextLine: string;
  keyNotes: string[];
}

export interface CustomBlendRecommendationSet {
  best: CustomBlendOption;
  refreshingAlternative: CustomBlendOption;
  softAlternative: CustomBlendOption;
}

export interface CustomBlendVisualProfile {
  chips: string[];
  bars: Array<{
    key: 'refresh' | 'balance' | 'depth';
    label: string;
    value: number;
  }>;
}

interface ComboScore {
  ingredientIds: CustomBlendIngredientId[];
  score: number;
  notes: string[];
}

function getStableHash(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 1000003;
  }

  return hash;
}

function combinations<T>(items: T[], minSize: number, maxSize: number): T[][] {
  const results: T[][] = [];

  function walk(startIndex: number, current: T[]) {
    if (current.length >= minSize && current.length <= maxSize) {
      results.push([...current]);
    }

    if (current.length === maxSize) {
      return;
    }

    for (let index = startIndex; index < items.length; index += 1) {
      current.push(items[index]);
      walk(index + 1, current);
      current.pop();
    }
  }

  walk(0, []);
  return results;
}

function getTimeSlotLabel(timeSlot: TimeSlot): string {
  switch (timeSlot) {
    case 'morning':
      return '아침';
    case 'late_morning':
      return '늦은 오전';
    case 'afternoon':
      return '오후';
    case 'early_evening':
      return '이른 저녁';
    case 'late_night':
      return '늦은 밤';
  }
}

function getTargetTags(context: TeaRecommendationContext): CustomBlendToneTag[] {
  const targetTags = new Set<CustomBlendToneTag>(['daily']);

  context.tags.forEach((tag) => {
    switch (tag) {
      case 'low_stimulation':
        targetTags.add('soft');
        targetTags.add('night');
        break;
      case 'gentle_balance':
        targetTags.add('soft');
        targetTags.add('daily');
        break;
      case 'focus_ready':
        targetTags.add('focus');
        targetTags.add('structure');
        break;
      case 'mood_reset':
        targetTags.add('refresh');
        targetTags.add('fruit');
        break;
      case 'refresh_hydration':
        targetTags.add('refresh');
        targetTags.add('citrus');
        break;
      case 'light_refresh':
        targetTags.add('refresh');
        targetTags.add('clean');
        break;
      case 'after_activity':
        targetTags.add('clean');
        targetTags.add('refresh');
        break;
      case 'steady_flow':
        targetTags.add('daily');
        targetTags.add('structure');
        break;
      case 'clean_finish':
        targetTags.add('clean');
        targetTags.add('mint');
        break;
      case 'night_friendly':
        targetTags.add('night');
        targetTags.add('soft');
        break;
    }
  });

  switch (context.activeGoal) {
    case '피로 관리':
      targetTags.add('soft');
      targetTags.add('cozy');
      break;
    case '수면 관리':
      targetTags.add('night');
      targetTags.add('soft');
      break;
    case '식습관 관리':
      targetTags.add('clean');
      targetTags.add('citrus');
      break;
    case '운동 루틴 유지':
      targetTags.add('focus');
      targetTags.add('refresh');
      break;
    case '기분 관리':
      targetTags.add('fruit');
      targetTags.add('refresh');
      break;
  }

  if (context.timeSlot === 'late_night') {
    targetTags.add('night');
    targetTags.add('soft');
  }

  return Array.from(targetTags);
}

function scoreIngredient(
  ingredientId: CustomBlendIngredientId,
  context: TeaRecommendationContext,
  targetTags: CustomBlendToneTag[]
) {
  const ingredient = customBlendIngredients[ingredientId];
  let score = 0;
  const notes: string[] = [];

  ingredient.tags.forEach((tag) => {
    if (targetTags.includes(tag)) {
      score += 3;
      if (notes.length < 2) {
        notes.push(ingredient.notes[0] || ingredient.name);
      }
    }
  });

  if (ingredient.preferredGoals?.includes(context.activeGoal as WellnessGoal)) {
    score += 2;
  }

  if (context.timeSlot === 'late_night' && ingredient.avoidLateNight) {
    score -= 5;
  }

  if (context.timeSlot === 'morning' && ingredient.tags.includes('focus')) {
    score += 2;
  }

  if ((context.timeSlot === 'afternoon' || context.timeSlot === 'early_evening') && ingredient.tags.includes('refresh')) {
    score += 2;
  }

  return { score, notes };
}

function includesAll(combo: CustomBlendIngredientId[], ingredientIds: CustomBlendIngredientId[]) {
  return ingredientIds.every((ingredientId) => combo.includes(ingredientId));
}

function getComboRuleAdjustment(combo: CustomBlendIngredientId[]) {
  let scoreDelta = 0;
  const notes: string[] = [];

  customBlendRules.forEach((rule) => {
    if (!includesAll(combo, rule.ingredientIds)) {
      return;
    }

    if (rule.kind === 'ban') {
      scoreDelta -= 100;
      notes.push(rule.reason);
      return;
    }

    scoreDelta += rule.scoreDelta || 0;
    notes.push(rule.reason);
  });

  const citrusCount = combo.filter((ingredientId) =>
    customBlendIngredients[ingredientId].tags.includes('citrus')
  ).length;

  if (citrusCount >= 3) {
    scoreDelta -= 4;
    notes.push('시트러스가 많아 결이 날카로워질 수 있어요.');
  }

  return { scoreDelta, notes };
}

function scoreCombo(
  combo: CustomBlendIngredientId[],
  context: TeaRecommendationContext,
  targetTags: CustomBlendToneTag[]
): ComboScore {
  let score = 0;
  const notes: string[] = [];

  combo.forEach((ingredientId) => {
    const ingredientScore = scoreIngredient(ingredientId, context, targetTags);
    score += ingredientScore.score;
    notes.push(...ingredientScore.notes);
  });

  const ruleAdjustment = getComboRuleAdjustment(combo);
  const averagedIngredientScore = score / combo.length;
  score = averagedIngredientScore * 3 + ruleAdjustment.scoreDelta;
  notes.push(...ruleAdjustment.notes);

  if (combo.length === 1) {
    score += 4;
  } else if (combo.length === 2) {
    score += 3;
  } else if (combo.length === 3) {
    score += 1;
  }

  return {
    ingredientIds: [customBlendBaseIngredientId, ...combo],
    score,
    notes: Array.from(new Set(notes)).slice(0, 3),
  };
}

function getDominantTags(ingredientIds: CustomBlendIngredientId[]) {
  const counts = new Map<CustomBlendToneTag, number>();

  ingredientIds.forEach((ingredientId) => {
    customBlendIngredients[ingredientId].tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([tag]) => tag);
}

const chipLabelByTag: Partial<Record<CustomBlendToneTag, string>> = {
  refresh: '산뜻한 전환',
  soft: '부드러운 결',
  focus: '집중감',
  citrus: '시트러스',
  mint: '민트 무드',
  fruit: '프루티',
  cozy: '포근한 여운',
  floral: '은은한 꽃결',
  structure: '구조감',
  clean: '깔끔한 마무리',
  daily: '데일리',
};

function getTagLabels(tags: CustomBlendToneTag[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => chipLabelByTag[tag])
        .filter((label): label is string => Boolean(label))
    )
  ).slice(0, 4);
}

const singleDisplayNameMap: Partial<Record<CustomBlendIngredientId, string>> = {
  lemonPeel: '시트러스 듀',
  grapefruitPeel: '브라이트 필',
  orangePeel: '선셋 필',
  mint: '쿨 카카오',
  peppermint: '민트 웨이브',
  hazelnut: '너트 베일',
  rooibos: '소프트 코어',
  hibiscus: '루비 노트',
  lemongrass: '클린 라인',
  bergamot: '클래식 톤',
  appleChip: '애플 허쉬',
  cinnamon: '웜 코드',
  cacaoHusk: '코코아 레이어',
};

const pairDisplayNameMap: Record<string, string> = {
  'hibiscus|orangePeel': '루비 스플래시',
  'hibiscus|rosehip': '핑크 모먼트',
  'lemonPeel|mint': '클리어 브리즈',
  'lemonPeel|peppermint': '아이시 리프',
  'rooibos|lemongrass': '소프트 플로우',
  'rooibos|appleChip': '데일리 허쉬',
  'hazelnut|cacaoHusk': '코코 넛지',
  'bergamot|hazelnut': '실키 클래식',
  'grapefruitPeel|mint': '프레시 엣지',
  'orangePeel|cinnamon': '웜 시트러스',
  'cornflower|lycheeFlavor': '플로럴 미스트',
};

const trioDisplayNameMap: Record<string, string> = {
  'hibiscus|orangePeel|rosehip': '루비 오라',
  'lemonPeel|mint|hibiscus': '클리어 스플래시',
  'lemonPeel|mint|peppermint': '쿨 브리즈',
  'rooibos|lemongrass|rosehip': '오로라 밸런스',
  'rooibos|appleChip|cinnamon': '소프트 앰버',
  'hazelnut|cacaoHusk|cinnamon': '벨벳 코코아',
  'bergamot|hazelnut|oolong': '골든 톤',
  'grapefruitPeel|hibiscus|mint': '브라이트 웨이브',
};

const moodLeadsByTag: Partial<Record<CustomBlendToneTag, string[]>> = {
  refresh: ['클리어', '브라이트', '프레시', '에어리', '라이트'],
  citrus: ['시트러스', '썬릿', '골든', '듀', '리프'],
  soft: ['소프트', '벨벳', '코지', '젠틀', '실키'],
  cozy: ['웜', '앰버', '허쉬', '멜로우', '누크'],
  focus: ['크리스프', '노블', '스틸', '샤프', '퀘트'],
  structure: ['클래식', '딥', '밸런스', '코어', '리듬'],
  fruit: ['루비', '프루트', '라이트', '글로우', '브리즈'],
  floral: ['플로럴', '미스트', '페탈', '블룸', '에어'],
  mint: ['쿨', '민트', '에어리', '브리즈', '리프'],
  chocolaty: ['코코아', '브라운', '실키', '누아', '벨벳'],
  daily: ['데일리', '이지', '소프트', '밸런스', '플로우'],
};

const senseWordsByLength: Record<number, string[]> = {
  1: ['듀', '베일', '노트', '톤', '웨이브', '터치', '힌트'],
  2: ['브리즈', '플로우', '리듬', '무드', '스플래시', '라인', '밸런스'],
  3: ['밸런스', '레이어', '오라', '실루엣', '클래식', '하모니', '플로우'],
};

const aromaPhraseByTag: Partial<Record<CustomBlendToneTag, string>> = {
  refresh: '산뜻한 허브감',
  citrus: '선명한 시트러스 향',
  soft: '부드럽게 풀리는 결',
  cozy: '포근한 여운',
  focus: '또렷한 인상',
  structure: '정돈된 구조감',
  fruit: '밝은 과일감',
  floral: '은은한 꽃결',
  mint: '쿨한 민트감',
  chocolaty: '카카오 결',
  clean: '깔끔한 마무리',
};

const moodPhraseByTag: Partial<Record<CustomBlendToneTag, string>> = {
  refresh: '맑고 가볍게 정리되는 무드',
  citrus: '환하게 열리는 인상',
  soft: '차분하고 부드러운 흐름',
  cozy: '포근하게 내려앉는 무드',
  focus: '또렷하고 집중감 있는 결',
  structure: '균형감 있게 잡힌 리듬',
  fruit: '가볍게 기분이 바뀌는 감각',
  floral: '은은하게 번지는 분위기',
  mint: '깨끗하게 환기되는 인상',
  chocolaty: '깊이감 있게 이어지는 결',
};

const contextLabelByTag: Partial<Record<CustomBlendToneTag, string>> = {
  refresh: '산뜻한 전환',
  citrus: '맑은 시트러스',
  soft: '부드러운 흐름',
  cozy: '포근한 여운',
  focus: '또렷한 집중감',
  structure: '정돈된 밸런스',
  fruit: '밝은 과일감',
  floral: '은은한 꽃결',
  mint: '쿨한 환기감',
  chocolaty: '카카오 깊이감',
  clean: '깔끔한 마무리',
  daily: '가벼운 데일리 무드',
};

function getCoreIngredientKey(ingredientIds: CustomBlendIngredientId[]) {
  return [...ingredientIds].sort().join('|');
}

function pickByHash(values: string[], seedKey: string) {
  return values[getStableHash(seedKey) % values.length];
}

function getLeadMoodWord(
  tags: CustomBlendToneTag[],
  recommendationType: CustomBlendOption['recommendationType'],
  ingredientCount: number,
  seedKey: string
) {
  if (recommendationType === 'fresh') {
    return pickByHash(['클리어', '브라이트', '프레시'], `${seedKey}|fresh|${ingredientCount}`);
  }

  if (recommendationType === 'soft') {
    return pickByHash(['소프트', '벨벳', '코지'], `${seedKey}|soft|${ingredientCount}`);
  }

  const dominantTag = tags[0] || 'daily';
  const candidates = moodLeadsByTag[dominantTag] || ['밸런스', '데일리', '클래식'];
  return pickByHash(candidates, `${seedKey}|lead|${dominantTag}|${ingredientCount}`);
}

function getSenseWord(
  tags: CustomBlendToneTag[],
  ingredientCount: number,
  seedKey: string
) {
  if (ingredientCount === 1 && tags.includes('chocolaty')) {
    return pickByHash(['베일', '노트', '톤'], `${seedKey}|single|deep`);
  }

  const candidates = senseWordsByLength[Math.min(Math.max(ingredientCount, 1), 3)] || senseWordsByLength[2];
  return pickByHash(candidates, `${seedKey}|sense|${ingredientCount}`);
}

function getDisplayName(
  ingredientIds: CustomBlendIngredientId[],
  tags: CustomBlendToneTag[],
  recommendationType: CustomBlendOption['recommendationType']
) {
  const coreKey = getCoreIngredientKey(ingredientIds);

  if (ingredientIds.length === 1) {
    const directName = singleDisplayNameMap[ingredientIds[0]];
    if (directName) {
      return directName;
    }
  }

  if (ingredientIds.length === 2 && pairDisplayNameMap[coreKey]) {
    return pairDisplayNameMap[coreKey];
  }

  if (ingredientIds.length === 3 && trioDisplayNameMap[coreKey]) {
    return trioDisplayNameMap[coreKey];
  }

  const seedKey = `${coreKey}|${recommendationType}`;
  return `${getLeadMoodWord(tags, recommendationType, ingredientIds.length, seedKey)} ${getSenseWord(tags, ingredientIds.length, seedKey)}`;
}

function getAromaPhrase(tags: CustomBlendToneTag[]) {
  const dominantTag = tags[0] || 'daily';
  return aromaPhraseByTag[dominantTag] || '부드럽게 이어지는 향';
}

function getMoodPhrase(tags: CustomBlendToneTag[]) {
  const dominantTag = tags[0] || 'daily';
  return moodPhraseByTag[dominantTag] || '무난하고 편안한 흐름';
}

function getContextLine(
  context: TeaRecommendationContext,
  ingredientIds: CustomBlendIngredientId[],
  tags: CustomBlendToneTag[]
) {
  const dominantTag = tags[0] || 'daily';
  const dominantLabel = contextLabelByTag[dominantTag] || '가벼운 균형감';
  const noteCandidates = ingredientIds.flatMap((ingredientId) => customBlendIngredients[ingredientId].notes);
  const noteLabel = pickByHash(
    noteCandidates.length > 0 ? noteCandidates : ['정돈감'],
    `${ingredientIds.join('|')}|context|${dominantTag}`
  );

  return `${getTimeSlotLabel(context.timeSlot)} · ${dominantLabel} · ${noteLabel}`;
}

function formatCoreNames(ingredientIds: CustomBlendIngredientId[]) {
  const coreNames = ingredientIds.map((ingredientId) => customBlendIngredients[ingredientId].name);

  if (coreNames.length === 1) {
    return coreNames[0];
  }

  if (coreNames.length === 2) {
    return `${coreNames[0]}와 ${coreNames[1]}`;
  }

  return `${coreNames[0]}, ${coreNames[1]}와 ${coreNames[2]}`;
}

function getSummary(tags: CustomBlendToneTag[], ingredientIds: CustomBlendIngredientId[]) {
  const coreNames = formatCoreNames(ingredientIds);
  const aromaPhrase = getAromaPhrase(tags);
  const moodPhrase = getMoodPhrase(tags);
  const templates = [
    `카카오닙 위에 ${coreNames}이 겹쳐지며 ${moodPhrase}이 살아나요.`,
    `${coreNames} 중심으로 ${aromaPhrase}이 먼저 느껴지는 조합이에요.`,
    `${coreNames}을 더해 ${moodPhrase} 쪽으로 가볍게 기울인 제안이에요.`,
  ];

  return pickByHash(templates, `${ingredientIds.join('|')}|summary`);
}

function getDetail(
  ingredientIds: CustomBlendIngredientId[],
  tags: CustomBlendToneTag[],
  contextLine: string
) {
  const coreNames = formatCoreNames(ingredientIds);
  const noteHighlights = ingredientIds
    .slice(0, 2)
    .map((ingredientId) => customBlendIngredients[ingredientId].notes[0])
    .join('과 ');
  const aromaPhrase = getAromaPhrase(tags);
  const moodPhrase = getMoodPhrase(tags);
  const templates = [
    `${aromaPhrase}와 ${noteHighlights}이 먼저 느껴지고, ${moodPhrase}으로 이어져요. ${contextLine}에 곁들이기 좋은 조합이에요.`,
    `${coreNames}이 카카오닙과 포개지며 ${aromaPhrase}이 또렷해져요. 마무리는 ${moodPhrase} 쪽으로 정돈돼요.`,
    `${noteHighlights}이 앞에서 열리고 뒤로 갈수록 ${moodPhrase}이 남아요. ${contextLine}에 고르면 결이 자연스럽게 이어져요.`,
  ];

  return pickByHash(templates, `${ingredientIds.join('|')}|detail`);
}

function getReason(tags: CustomBlendToneTag[], toneLabel: string) {
  if (toneLabel.includes('산뜻')) {
    return `${getAromaPhrase(tags)}을 더 살린 가벼운 변주예요.`;
  }

  if (toneLabel.includes('부드러운')) {
    return `${getMoodPhrase(tags)}으로 부드럽게 기울인 대안이에요.`;
  }

  return `${getMoodPhrase(tags)}이 오늘 흐름과 자연스럽게 맞물려요.`;
}

function toOption(
  label: CustomBlendOption['label'],
  toneLabel: string,
  comboScore: ComboScore,
  context: TeaRecommendationContext
): CustomBlendOption {
  const ingredientNames = comboScore.ingredientIds.map((ingredientId) => customBlendIngredients[ingredientId].name);
  const ingredientCore = comboScore.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId);
  const dominantTags = getDominantTags(ingredientCore);
  const recommendationType = label === 'refreshing' ? 'fresh' : label;
  const displayName = getDisplayName(ingredientCore, dominantTags, recommendationType);
  const contextLine = getContextLine(context, ingredientCore, dominantTags);

  return {
    label,
    recommendationType,
    displayName,
    title: displayName,
    toneLabel,
    ingredientIds: comboScore.ingredientIds,
    ingredientNames,
    score: comboScore.score,
    summary: getSummary(dominantTags, ingredientCore),
    detail: getDetail(ingredientCore, dominantTags, contextLine),
    tags: getTagLabels(dominantTags),
    reason: getReason(dominantTags, toneLabel),
    contextLine,
    keyNotes: comboScore.notes,
  };
}

function getComboKey(combo: ComboScore) {
  return combo.ingredientIds.join('|');
}

function getSeedBase(context: TeaRecommendationContext) {
  return [
    context.timeSlot,
    context.activeGoal,
    ...context.tags,
  ].join('|');
}

function getPreferredLengths(
  recommendationType: 'best' | 'refreshing' | 'soft',
  context: TeaRecommendationContext,
  usedLengths: Set<number> = new Set()
) {
  const weightedLengthsByType: Record<typeof recommendationType, number[]> = {
    best: [1, 2, 2, 3, 2, 3],
    refreshing: [2, 1, 2, 3, 2, 3],
    soft: [1, 2, 1, 3, 2, 1],
  };
  const weightedLengths = weightedLengthsByType[recommendationType];
  const seed = getStableHash(`${getSeedBase(context)}|${recommendationType}`);
  const firstLength = weightedLengths[seed % weightedLengths.length];
  const rotatedLengths = [
    firstLength,
    ...[1, 2, 3].filter((length) => length !== firstLength),
  ];

  return [
    ...rotatedLengths.filter((length) => !usedLengths.has(length)),
    ...rotatedLengths.filter((length) => usedLengths.has(length)),
  ];
}

function pickDistinctCombo(
  scoredCombos: ComboScore[],
  context: TeaRecommendationContext,
  excludedKeys: Set<string>,
  requiredTag?: CustomBlendToneTag,
  preferredLengths: number[] = [],
  usedIngredientIds: Set<CustomBlendIngredientId> = new Set()
) {
  const availableCombos = scoredCombos.filter((combo) => !excludedKeys.has(getComboKey(combo)));
  const scoredOptions = availableCombos.map((combo) => {
    const ingredientCore = combo.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId);
    const overlapCount = ingredientCore.filter((ingredientId) => usedIngredientIds.has(ingredientId)).length;
    const comboLength = ingredientCore.length;
    const comboKey = getComboKey(combo);
    let diversityScore = combo.score;

    if (requiredTag && combo.ingredientIds.some((ingredientId) => customBlendIngredients[ingredientId].tags.includes(requiredTag))) {
      diversityScore += 8;
    }

    if (preferredLengths[0] === comboLength) {
      diversityScore += 9;
    } else if (preferredLengths.includes(comboLength)) {
      diversityScore += 4;
    }

    if (comboLength === 1) {
      diversityScore += 2;
    } else if (comboLength === 2) {
      diversityScore += 3;
    } else {
      diversityScore += 1;
    }

    diversityScore -= overlapCount * 4;
    diversityScore += (getStableHash(`${getSeedBase(context)}|${requiredTag || 'base'}|${comboKey}`) % 13) / 10;

    return {
      combo,
      diversityScore,
    };
  });

  return scoredOptions.sort((left, right) => right.diversityScore - left.diversityScore)[0]?.combo || scoredCombos[0];
}

function clampBarValue(value: number) {
  return Math.max(1, Math.min(5, value));
}

export function getCustomBlendVisualProfile(option: CustomBlendOption): CustomBlendVisualProfile {
  const ingredientIds = option.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId);
  const tags = ingredientIds.flatMap((ingredientId) => customBlendIngredients[ingredientId].tags);

  const refreshScore = clampBarValue(
    tags.filter((tag) => ['refresh', 'citrus', 'mint', 'fruit', 'clean'].includes(tag)).length
  );
  const balanceScore = clampBarValue(
    tags.filter((tag) => ['daily', 'soft', 'clean', 'structure'].includes(tag)).length
  );
  const depthScore = clampBarValue(
    tags.filter((tag) => ['structure', 'cozy', 'chocolaty', 'focus', 'soft'].includes(tag)).length
  );

  return {
    chips: option.tags.slice(0, 3),
    bars: [
      { key: 'refresh', label: '리프레시', value: refreshScore },
      { key: 'balance', label: '밸런스', value: balanceScore },
      { key: 'depth', label: '깊이감', value: depthScore },
    ],
  };
}

export function getCustomBlendRecommendations({
  logs,
  userGoal,
  now = new Date(),
}: CustomBlendInput): CustomBlendRecommendationSet {
  const context = deriveTeaRecommendationContext({
    logs,
    userGoal,
    now,
  });

  const targetTags = getTargetTags(context);
  const comboCandidates = combinations(customBlendCandidateIds, 1, 3);
  const scoredCombos = comboCandidates
    .map((combo) => scoreCombo(combo, context, targetTags))
    .filter((combo) => combo.score > -50)
    .sort((left, right) => right.score - left.score);

  const bestCombo = pickDistinctCombo(
    scoredCombos,
    context,
    new Set<string>(),
    undefined,
    getPreferredLengths('best', context),
    new Set<CustomBlendIngredientId>()
  );
  const usedComboKeys = new Set<string>([getComboKey(bestCombo)]);
  const usedIngredientIds = new Set<CustomBlendIngredientId>(
    bestCombo.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId)
  );
  const usedLengths = new Set<number>([
    bestCombo.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId).length,
  ]);

  const refreshingCombo = pickDistinctCombo(
    scoredCombos,
    context,
    usedComboKeys,
    'refresh',
    getPreferredLengths('refreshing', context, usedLengths),
    usedIngredientIds
  );
  usedComboKeys.add(getComboKey(refreshingCombo));
  refreshingCombo.ingredientIds
    .filter((ingredientId) => ingredientId !== customBlendBaseIngredientId)
    .forEach((ingredientId) => usedIngredientIds.add(ingredientId));
  usedLengths.add(
    refreshingCombo.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId).length
  );

  const softCombo = pickDistinctCombo(
    scoredCombos,
    context,
    usedComboKeys,
    'soft',
    getPreferredLengths('soft', context, usedLengths),
    usedIngredientIds
  );

  return {
    best: toOption('best', '가장 잘 맞는 조합', bestCombo, context),
    refreshingAlternative: toOption('refreshing', '더 산뜻한 대안', refreshingCombo, context),
    softAlternative: toOption('soft', '더 부드러운 대안', softCombo, context),
  };
}
