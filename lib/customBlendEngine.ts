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
  title: string;
  toneLabel: string;
  ingredientIds: CustomBlendIngredientId[];
  ingredientNames: string[];
  score: number;
  reason: string;
  contextLine: string;
  keyNotes: string[];
}

export interface CustomBlendRecommendationSet {
  best: CustomBlendOption;
  refreshingAlternative: CustomBlendOption;
  softAlternative: CustomBlendOption;
}

interface ComboScore {
  ingredientIds: CustomBlendIngredientId[];
  score: number;
  notes: string[];
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
  score += ruleAdjustment.scoreDelta;
  notes.push(...ruleAdjustment.notes);

  return {
    ingredientIds: [customBlendBaseIngredientId, ...combo],
    score,
    notes: Array.from(new Set(notes)).slice(0, 3),
  };
}

function getContextLine(context: TeaRecommendationContext, combo: CustomBlendIngredientId[]) {
  const firstIngredient = customBlendIngredients[combo[0]];
  return `${getTimeSlotLabel(context.timeSlot)} · ${firstIngredient.notes[0] || firstIngredient.name} 중심`;
}

function getReason(context: TeaRecommendationContext, combo: CustomBlendIngredientId[], toneLabel: string) {
  const ingredientNames = combo.map((ingredientId) => customBlendIngredients[ingredientId].name);
  return `${toneLabel} 쪽으로 맞춘 조합이에요. ${ingredientNames.slice(0, 2).join(', ')}의 결이 오늘 흐름에 자연스럽게 이어집니다.`;
}

function toOption(
  label: CustomBlendOption['label'],
  toneLabel: string,
  comboScore: ComboScore,
  context: TeaRecommendationContext
): CustomBlendOption {
  const ingredientNames = comboScore.ingredientIds.map((ingredientId) => customBlendIngredients[ingredientId].name);
  const ingredientCore = comboScore.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId);

  return {
    label,
    title: `${ingredientNames.slice(0, 3).join(' · ')} 블렌드`,
    toneLabel,
    ingredientIds: comboScore.ingredientIds,
    ingredientNames,
    score: comboScore.score,
    reason: getReason(context, ingredientCore, toneLabel),
    contextLine: getContextLine(context, ingredientCore),
    keyNotes: comboScore.notes,
  };
}

function pickAlternative(
  scoredCombos: ComboScore[],
  bestCombo: ComboScore,
  requiredTag: CustomBlendToneTag,
  fallbackIndex: number
) {
  return (
    scoredCombos.find(
      (combo) =>
        combo.ingredientIds.some((ingredientId) =>
          customBlendIngredients[ingredientId].tags.includes(requiredTag)
        ) && combo.ingredientIds.join('|') !== bestCombo.ingredientIds.join('|')
    ) || scoredCombos[fallbackIndex] || bestCombo
  );
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

  const bestCombo = scoredCombos[0];
  const refreshingCombo = pickAlternative(scoredCombos, bestCombo, 'refresh', 1);
  const softCombo = pickAlternative(scoredCombos, bestCombo, 'soft', 2);

  return {
    best: toOption('best', '가장 잘 맞는 조합', bestCombo, context),
    refreshingAlternative: toOption('refreshing', '더 산뜻한 대안', refreshingCombo, context),
    softAlternative: toOption('soft', '더 부드러운 대안', softCombo, context),
  };
}
