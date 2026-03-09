import { TeaRecommendationId } from '@/lib/teaRecommendationContent';
import { getTeaPresentationProfile } from '@/lib/teaProfiles';
import { CustomBlendOption } from './customBlendEngine';
import { customBlendBaseIngredientId, customBlendIngredients, CustomBlendIngredientId } from './customBlendIngredients';

const CUSTOM_BLEND_BASE_RATIO = 25;
const CUSTOM_BLEND_EXTRA_TOTAL = 75;

type LabAxisKey = 'structure' | 'refresh' | 'complexity' | 'dailyFit' | 'moodShift';

export interface CustomBlendLabAxis {
  key: LabAxisKey;
  label: '구조감' | '산뜻함' | '풍미감' | '데일리성' | '기분 전환';
  value: number;
}

export interface CustomBlendLabMatch {
  teaId: TeaRecommendationId;
  name: string;
  similarity: number;
}

export interface CustomBlendLabReading {
  axes: CustomBlendLabAxis[];
  summary: string;
  detail: string;
  features: string[];
  moments: string[];
  primaryMatch: CustomBlendLabMatch;
  secondaryMatch: CustomBlendLabMatch;
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(CUSTOM_BLEND_EXTRA_TOTAL, Math.round(value)));
}

function normalizeExtraRatios(
  ingredientIds: CustomBlendIngredientId[],
  rawRatios: Partial<Record<CustomBlendIngredientId, number>>
) {
  if (ingredientIds.length === 0) {
    return {};
  }

  if (ingredientIds.length === 1) {
    return { [ingredientIds[0]]: CUSTOM_BLEND_EXTRA_TOTAL } as Record<CustomBlendIngredientId, number>;
  }

  const rawValues = ingredientIds.map((ingredientId) => clampPercentage(rawRatios[ingredientId] ?? 0));
  const total = rawValues.reduce((sum, value) => sum + value, 0);

  if (total === CUSTOM_BLEND_EXTRA_TOTAL) {
    return Object.fromEntries(ingredientIds.map((ingredientId, index) => [ingredientId, rawValues[index]])) as Record<CustomBlendIngredientId, number>;
  }

  if (total === 0) {
    const baseShare = Math.floor(CUSTOM_BLEND_EXTRA_TOTAL / ingredientIds.length);
    const ratios = ingredientIds.reduce<Record<CustomBlendIngredientId, number>>((acc, ingredientId, index) => {
      acc[ingredientId] = baseShare + (index === ingredientIds.length - 1 ? CUSTOM_BLEND_EXTRA_TOTAL - baseShare * ingredientIds.length : 0);
      return acc;
    }, {} as Record<CustomBlendIngredientId, number>);
    return ratios;
  }

  const scaled = rawValues.map((value) => (value / total) * CUSTOM_BLEND_EXTRA_TOTAL);
  const rounded = scaled.map((value) => Math.floor(value));
  let remainder = CUSTOM_BLEND_EXTRA_TOTAL - rounded.reduce((sum, value) => sum + value, 0);

  const fractions = scaled
    .map((value, index) => ({ index, fraction: value - rounded[index] }))
    .sort((left, right) => right.fraction - left.fraction);

  for (let index = 0; index < fractions.length && remainder > 0; index += 1) {
    rounded[fractions[index].index] += 1;
    remainder -= 1;
  }

  return Object.fromEntries(ingredientIds.map((ingredientId, index) => [ingredientId, rounded[index]])) as Record<CustomBlendIngredientId, number>;
}

export function createInitialCustomBlendRatios(option: CustomBlendOption) {
  const ingredientIds = option.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId);

  if (ingredientIds.length === 0) {
    return {};
  }

  if (option.blendRatios) {
    return normalizeExtraRatios(ingredientIds, option.blendRatios);
  }

  const equalShare = Math.floor(CUSTOM_BLEND_EXTRA_TOTAL / ingredientIds.length);
  const initialRatios = ingredientIds.reduce<Record<CustomBlendIngredientId, number>>((acc, ingredientId, index) => {
    acc[ingredientId] =
      equalShare + (index === ingredientIds.length - 1 ? CUSTOM_BLEND_EXTRA_TOTAL - equalShare * ingredientIds.length : 0);
    return acc;
  }, {} as Record<CustomBlendIngredientId, number>);

  return normalizeExtraRatios(ingredientIds, initialRatios);
}

export function redistributeCustomBlendRatios(
  ingredientIds: CustomBlendIngredientId[],
  currentRatios: Partial<Record<CustomBlendIngredientId, number>>,
  changedIngredientId: CustomBlendIngredientId,
  nextValue: number
) {
  if (ingredientIds.length <= 1) {
    return normalizeExtraRatios(ingredientIds, currentRatios);
  }

  const clampedValue = clampPercentage(nextValue);
  const remaining = CUSTOM_BLEND_EXTRA_TOTAL - clampedValue;
  const otherIds = ingredientIds.filter((ingredientId) => ingredientId !== changedIngredientId);
  const otherTotal = otherIds.reduce((sum, ingredientId) => sum + (currentRatios[ingredientId] || 0), 0);

  const nextRatios: Partial<Record<CustomBlendIngredientId, number>> = {
    ...currentRatios,
    [changedIngredientId]: clampedValue,
  };

  if (otherTotal <= 0) {
    const shared = Math.floor(remaining / otherIds.length);
    otherIds.forEach((ingredientId, index) => {
      nextRatios[ingredientId] = shared + (index === otherIds.length - 1 ? remaining - shared * otherIds.length : 0);
    });

    return normalizeExtraRatios(ingredientIds, nextRatios);
  }

  let assigned = 0;
  otherIds.forEach((ingredientId, index) => {
    if (index === otherIds.length - 1) {
      nextRatios[ingredientId] = remaining - assigned;
      return;
    }

    const share = Math.round((remaining * (currentRatios[ingredientId] || 0)) / otherTotal);
    nextRatios[ingredientId] = share;
    assigned += share;
  });

  return normalizeExtraRatios(ingredientIds, nextRatios);
}

function scoreFromTags(ingredientId: CustomBlendIngredientId): Record<LabAxisKey, number> {
  const ingredient = customBlendIngredients[ingredientId];
  const tags = ingredient.tags;

  return {
    structure: 2 + (tags.includes('structure') ? 4 : 0) + (tags.includes('focus') ? 2 : 0) + (tags.includes('chocolaty') ? 1 : 0) + (tags.includes('cozy') ? 1 : 0),
    refresh: 2 + (tags.includes('refresh') ? 4 : 0) + (tags.includes('citrus') ? 2 : 0) + (tags.includes('mint') ? 2 : 0) + (tags.includes('clean') ? 1 : 0),
    complexity: 2 + (tags.includes('fruit') ? 2 : 0) + (tags.includes('floral') ? 2 : 0) + (tags.includes('citrus') ? 1 : 0) + (tags.includes('chocolaty') ? 2 : 0) + (tags.includes('structure') ? 1 : 0),
    dailyFit: 2 + (tags.includes('daily') ? 4 : 0) + (tags.includes('soft') ? 1 : 0) + (tags.includes('night') ? 1 : 0) + (tags.includes('clean') ? 1 : 0),
    moodShift: 2 + (tags.includes('refresh') ? 2 : 0) + (tags.includes('fruit') ? 2 : 0) + (tags.includes('mint') ? 2 : 0) + (tags.includes('floral') ? 1 : 0) + (tags.includes('cozy') ? 1 : 0),
  };
}

function toFiveScale(value: number) {
  return Math.max(1, Math.min(5, Math.round((value / 10) * 5)));
}

function buildAxes(
  option: CustomBlendOption,
  blendRatios: Partial<Record<CustomBlendIngredientId, number>>
): CustomBlendLabAxis[] {
  const ingredientIds = option.ingredientIds;
  const weights = ingredientIds.map((ingredientId) => {
    if (ingredientId === customBlendBaseIngredientId) {
      return option.baseRatio ?? CUSTOM_BLEND_BASE_RATIO;
    }

    return blendRatios[ingredientId] ?? 0;
  });
  const totalWeight = weights.reduce((sum, value) => sum + value, 0) || 100;

  const aggregated = ingredientIds.reduce<Record<LabAxisKey, number>>((acc, ingredientId, index) => {
    const ingredientScores = scoreFromTags(ingredientId);
    const weight = weights[index];

    (Object.keys(acc) as LabAxisKey[]).forEach((axisKey) => {
      acc[axisKey] += ingredientScores[axisKey] * weight;
    });

    return acc;
  }, {
    structure: 0,
    refresh: 0,
    complexity: 0,
    dailyFit: 0,
    moodShift: 0,
  });

  return [
    { key: 'structure', label: '구조감', value: toFiveScale(aggregated.structure / totalWeight) },
    { key: 'refresh', label: '산뜻함', value: toFiveScale(aggregated.refresh / totalWeight) },
    { key: 'complexity', label: '풍미감', value: toFiveScale(aggregated.complexity / totalWeight) },
    { key: 'dailyFit', label: '데일리성', value: toFiveScale(aggregated.dailyFit / totalWeight) },
    { key: 'moodShift', label: '기분 전환', value: toFiveScale(aggregated.moodShift / totalWeight) },
  ];
}

function getSimilarityScores(axes: CustomBlendLabAxis[]) {
  const customValues = axes.map((axis) => axis.value);
  const teaIds: TeaRecommendationId[] = ['britishBlack', 'asianGold', 'hibiscusFruit', 'mintyChocolat'];

  return teaIds
    .map((teaId) => {
      const presetValues = getTeaPresentationProfile(teaId).map((axis) => axis.value);
      const distance = Math.sqrt(
        customValues.reduce((sum, value, index) => sum + ((value - presetValues[index]) ** 2), 0)
      );
      const similarity = Math.max(0, Math.min(100, Math.round((1 - distance / 10) * 100)));

      return {
        teaId,
        similarity,
      };
    })
    .sort((left, right) => right.similarity - left.similarity);
}

function getFeatureTexts(axes: CustomBlendLabAxis[]) {
  const featureMap: Record<LabAxisKey, string> = {
    structure: '구조감이 또렷해 중심이 단정하게 유지됩니다.',
    refresh: '산뜻한 결이 살아 있어 전환감이 빠르게 들어옵니다.',
    complexity: '풍미 레이어가 겹쳐져 한 모금의 변화가 분명합니다.',
    dailyFit: '부담 없이 이어가기 좋아 데일리 루틴에 잘 맞습니다.',
    moodShift: '기분 전환 포인트가 선명해 흐름을 바꾸기 좋습니다.',
  };

  return [...axes]
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map((axis) => featureMap[axis.key]);
}

function getMoments(axes: CustomBlendLabAxis[], option: CustomBlendOption) {
  const moments = new Set<string>();

  const axisByKey = Object.fromEntries(axes.map((axis) => [axis.key, axis.value])) as Record<LabAxisKey, number>;

  if (axisByKey.refresh >= 4) {
    moments.add('오후 전환');
    moments.add('가벼운 리셋');
  }

  if (axisByKey.dailyFit >= 4) {
    moments.add('데일리 루틴');
  }

  if (axisByKey.structure >= 4) {
    moments.add('집중 시간');
  }

  if (axisByKey.moodShift >= 4) {
    moments.add('기분 환기');
  }

  if (option.tags.some((tag) => ['부드러운 결', '포근한 여운'].includes(tag))) {
    moments.add('차분한 저녁');
  }

  if (moments.size < 4) {
    ['오후 한 잔', '식후 흐름', '가벼운 휴식', '집중 전 루틴'].forEach((moment) => {
      if (moments.size < 4) {
        moments.add(moment);
      }
    });
  }

  return Array.from(moments).slice(0, 4);
}

export function getCustomBlendLabReading(
  option: CustomBlendOption,
  blendRatios: Partial<Record<CustomBlendIngredientId, number>>
): CustomBlendLabReading {
  const axes = buildAxes(option, blendRatios);
  const similarityScores = getSimilarityScores(axes);
  const primaryMatch = similarityScores[0];
  const secondaryMatch = similarityScores[1];

  const primaryNameMap: Record<TeaRecommendationId, string> = {
    britishBlack: '브리티쉬 블랙',
    asianGold: '아시안 골드',
    hibiscusFruit: '히비스커스 프룻',
    mintyChocolat: '민티 쇼콜라',
  };

  return {
    axes,
    summary: `${primaryNameMap[primaryMatch.teaId]}의 결을 가장 가깝게 닮았고, ${primaryNameMap[secondaryMatch.teaId]}의 포인트가 보조로 얹히는 현재 조합이에요.`,
    detail: `${option.displayName}은 현재 비율 기준으로 ${axes
      .sort((left, right) => right.value - left.value)
      .slice(0, 2)
      .map((axis) => axis.label)
      .join(' · ')} 쪽이 먼저 느껴지는 흐름이에요.`,
    features: getFeatureTexts(axes),
    moments: getMoments(axes, option),
    primaryMatch: {
      teaId: primaryMatch.teaId,
      name: primaryNameMap[primaryMatch.teaId],
      similarity: primaryMatch.similarity,
    },
    secondaryMatch: {
      teaId: secondaryMatch.teaId,
      name: primaryNameMap[secondaryMatch.teaId],
      similarity: secondaryMatch.similarity,
    },
  };
}

export function createAdjustedCustomBlendOption(
  option: CustomBlendOption,
  blendRatios: Partial<Record<CustomBlendIngredientId, number>>
) {
  const normalizedRatios = createInitialCustomBlendRatios({
    ...option,
    blendRatios,
  });
  const reading = getCustomBlendLabReading(option, normalizedRatios);

  return {
    ...option,
    summary: reading.summary,
    detail: reading.detail,
    contextLine: reading.moments.slice(0, 2).join(' · '),
    baseRatio: CUSTOM_BLEND_BASE_RATIO,
    blendRatios: normalizedRatios,
  } satisfies CustomBlendOption;
}

export { CUSTOM_BLEND_BASE_RATIO, CUSTOM_BLEND_EXTRA_TOTAL };
