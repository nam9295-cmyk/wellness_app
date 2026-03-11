import {
  EXERCISE_STATES,
  MEAL_STATES,
  SLEEP_STATES,
  WATER_STATES,
  WellnessLog,
} from '@/types';

export const SCORE_SCALE = [1, 2, 3, 4, 5] as const;

export type ScoreValue = (typeof SCORE_SCALE)[number];
export type WellnessScoreCategory =
  | 'sleep'
  | 'fatigue'
  | 'mood'
  | 'stress'
  | 'meal'
  | 'exercise'
  | 'water';

export interface ScoreOption {
  score: ScoreValue;
  label: string;
}

export interface RhythmScores {
  physical: number;
  mental: number;
}

const DEFAULT_SCORE: ScoreValue = 3;

export const SLEEP_SCORE_OPTIONS: readonly ScoreOption[] = SLEEP_STATES.map((label, index) => ({
  score: (index + 1) as ScoreValue,
  label,
}));

export const FATIGUE_SCORE_OPTIONS: readonly ScoreOption[] = [
  { score: 1, label: '매우 피곤' },
  { score: 2, label: '피곤' },
  { score: 3, label: '보통' },
  { score: 4, label: '괜찮음' },
  { score: 5, label: '활기참' },
];

export const MOOD_SCORE_OPTIONS: readonly ScoreOption[] = [
  { score: 1, label: '많이 가라앉음' },
  { score: 2, label: '조금 가라앉음' },
  { score: 3, label: '보통' },
  { score: 4, label: '안정적' },
  { score: 5, label: '편안함' },
];

export const STRESS_SCORE_OPTIONS: readonly ScoreOption[] = [
  { score: 1, label: '매우 높음' },
  { score: 2, label: '높음' },
  { score: 3, label: '보통' },
  { score: 4, label: '안정적' },
  { score: 5, label: '매우 안정적' },
];

export const MEAL_SCORE_OPTIONS: readonly ScoreOption[] = [
  { score: 1, label: MEAL_STATES[0] },
  { score: 3, label: MEAL_STATES[1] },
  { score: 5, label: MEAL_STATES[2] },
];

export const EXERCISE_SCORE_OPTIONS: readonly ScoreOption[] = [
  { score: 1, label: EXERCISE_STATES[0] },
  { score: 3, label: EXERCISE_STATES[1] },
  { score: 5, label: EXERCISE_STATES[2] },
];

export const WATER_SCORE_OPTIONS: readonly ScoreOption[] = [
  { score: 1, label: WATER_STATES[0] },
  { score: 3, label: WATER_STATES[1] },
  { score: 5, label: WATER_STATES[2] },
];

export const wellnessScoreOptions: Record<WellnessScoreCategory, readonly ScoreOption[]> = {
  sleep: SLEEP_SCORE_OPTIONS,
  fatigue: FATIGUE_SCORE_OPTIONS,
  mood: MOOD_SCORE_OPTIONS,
  stress: STRESS_SCORE_OPTIONS,
  meal: MEAL_SCORE_OPTIONS,
  exercise: EXERCISE_SCORE_OPTIONS,
  water: WATER_SCORE_OPTIONS,
};

function clampScore(value: number, fallback: ScoreValue = DEFAULT_SCORE): ScoreValue {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(value);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > 5) {
    return 5;
  }

  return rounded as ScoreValue;
}

function parseScoreString(value: string): number | null {
  const fivePointMatch = value.match(/^(\d)(?:\s*\/\s*5)?$/);
  if (fivePointMatch) {
    return Number(fivePointMatch[1]);
  }

  return null;
}

export function getScoreLabel(
  category: WellnessScoreCategory,
  score: number,
  fallbackLabel = ''
): string {
  const option = wellnessScoreOptions[category].find((item) => item.score === clampScore(score));
  return option?.label ?? fallbackLabel;
}

export function getScoreFromLabel(
  category: WellnessScoreCategory,
  label: unknown,
  fallback: ScoreValue = DEFAULT_SCORE
): ScoreValue {
  if (typeof label !== 'string') {
    return fallback;
  }

  const matched = wellnessScoreOptions[category].find((item) => item.label === label);
  return matched?.score ?? fallback;
}

export function normalizeWellnessScore(
  category: WellnessScoreCategory,
  value: unknown,
  fallback: ScoreValue = DEFAULT_SCORE
): ScoreValue {
  if (typeof value === 'number') {
    return clampScore(value, fallback);
  }

  if (typeof value === 'string') {
    const parsed = parseScoreString(value);
    if (parsed !== null) {
      return clampScore(parsed, fallback);
    }

    return getScoreFromLabel(category, value, fallback);
  }

  return fallback;
}

export function normalizeSleepScore(value: unknown, fallback: ScoreValue = DEFAULT_SCORE) {
  return normalizeWellnessScore('sleep', value, fallback);
}

export function normalizeFatigueScore(value: unknown, fallback: ScoreValue = DEFAULT_SCORE) {
  return normalizeWellnessScore('fatigue', value, fallback);
}

export function normalizeMoodScore(value: unknown, fallback: ScoreValue = DEFAULT_SCORE) {
  return normalizeWellnessScore('mood', value, fallback);
}

export function normalizeStressScore(value: unknown, fallback: ScoreValue = DEFAULT_SCORE) {
  return normalizeWellnessScore('stress', value, fallback);
}

export function normalizeMealScore(value: unknown, fallback: ScoreValue = DEFAULT_SCORE) {
  return normalizeWellnessScore('meal', value, fallback);
}

export function normalizeExerciseScore(value: unknown, fallback: ScoreValue = DEFAULT_SCORE) {
  return normalizeWellnessScore('exercise', value, fallback);
}

export function normalizeWaterScore(value: unknown, fallback: ScoreValue = DEFAULT_SCORE) {
  return normalizeWellnessScore('water', value, fallback);
}

function averageWeightedScore(entries: Array<{ score: number; weight: number }>): number {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return DEFAULT_SCORE;
  }

  const weightedSum = entries.reduce((sum, entry) => sum + entry.score * entry.weight, 0);
  return Number((weightedSum / totalWeight).toFixed(1));
}

export function calculatePhysicalRhythmScore(input: {
  sleep: unknown;
  fatigue: unknown;
  meal: unknown;
  exercise: unknown;
  water: unknown;
}): number {
  return averageWeightedScore([
    { score: normalizeSleepScore(input.sleep), weight: 0.3 },
    { score: normalizeFatigueScore(input.fatigue), weight: 0.2 },
    { score: normalizeMealScore(input.meal), weight: 0.15 },
    { score: normalizeExerciseScore(input.exercise), weight: 0.15 },
    { score: normalizeWaterScore(input.water), weight: 0.2 },
  ]);
}

export function calculateMentalRhythmScore(input: {
  mood: unknown;
  stress?: unknown;
  fatigue: unknown;
}): number {
  return averageWeightedScore([
    { score: normalizeMoodScore(input.mood), weight: 0.45 },
    { score: normalizeStressScore(input.stress, DEFAULT_SCORE), weight: 0.35 },
    { score: normalizeFatigueScore(input.fatigue), weight: 0.2 },
  ]);
}

export function calculateRhythmScoresFromLog(
  log: Pick<WellnessLog, 'sleep' | 'fatigue' | 'mood' | 'meal' | 'exercise' | 'water'> & {
    stress?: unknown;
  }
): RhythmScores {
  return {
    physical: calculatePhysicalRhythmScore(log),
    mental: calculateMentalRhythmScore(log),
  };
}
