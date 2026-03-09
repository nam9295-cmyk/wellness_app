import { TeaRecommendationId, teaRecommendationContent } from '@/lib/teaRecommendationContent';
import { CustomBlendOption } from './customBlendEngine';
import { customBlendBaseIngredientId } from './customBlendIngredients';
import { readJson, writeJson } from './asyncStorage';

const TEA_BOX_KEY = '@wellness_tea_box_v1';

export interface PresetSavedBlendItem {
  id: string;
  type: 'preset';
  teaId: TeaRecommendationId;
  name: string;
  subtitle: string;
  identityLine: string;
  savedAt: string;
}

export interface CustomSavedBlendItem {
  id: string;
  type: 'custom';
  recommendationType: 'best' | 'fresh' | 'soft';
  displayName: string;
  baseIngredientId: string;
  baseRatio?: number;
  blendRatios?: Record<string, number>;
  selectedIngredientIds: string[];
  ingredientNames: string[];
  toneLabel: string;
  title: string;
  summary: string;
  detail: string;
  tags: string[];
  shortDescription: string;
  contextLine: string;
  savedAt: string;
}

export type SavedBlendItem = PresetSavedBlendItem | CustomSavedBlendItem;

function toTimestampString(date: Date) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

export function createCustomBlendItemId(option: CustomBlendOption): string {
  if (!option.blendRatios) {
    return `custom:${option.ingredientIds.join('-')}`;
  }

  const ratioKey = Object.entries(option.blendRatios)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([ingredientId, ratio]) => `${ingredientId}-${ratio}`)
    .join('_');

  return `custom:${option.ingredientIds.join('-')}:${ratioKey || 'default'}`;
}

export function createPresetSavedBlendItem(teaId: TeaRecommendationId): PresetSavedBlendItem {
  const tea = teaRecommendationContent[teaId];
  const savedAt = toTimestampString(new Date());

  return {
    id: teaId,
    type: 'preset',
    teaId,
    name: tea.name,
    subtitle: tea.subtitle,
    identityLine: tea.identityLine,
    savedAt,
  };
}

export function createCustomSavedBlendItem(option: CustomBlendOption): CustomSavedBlendItem {
  const savedAt = toTimestampString(new Date());

  return {
    id: createCustomBlendItemId(option),
    type: 'custom',
    recommendationType: option.recommendationType,
    displayName: option.displayName,
    baseIngredientId: customBlendBaseIngredientId,
    baseRatio: option.baseRatio,
    blendRatios: option.blendRatios ? Object.fromEntries(Object.entries(option.blendRatios)) : undefined,
    selectedIngredientIds: option.ingredientIds.filter((ingredientId) => ingredientId !== customBlendBaseIngredientId),
    ingredientNames: option.ingredientNames,
    toneLabel: option.toneLabel,
    title: option.title,
    summary: option.summary,
    detail: option.detail,
    tags: option.tags,
    shortDescription: option.reason,
    contextLine: option.contextLine,
    savedAt,
  };
}

function isTeaRecommendationId(value: unknown): value is TeaRecommendationId {
  return typeof value === 'string' && value in teaRecommendationContent;
}

function normalizeBlendRatios(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const ratioEntries = Object.entries(value).filter(([, entryValue]) => typeof entryValue === 'number');

  if (ratioEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(ratioEntries) as Record<string, number>;
}

function normalizeSavedBlendItem(item: unknown): SavedBlendItem | null {
  if (typeof item === 'string' && isTeaRecommendationId(item)) {
    return createPresetSavedBlendItem(item);
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as Record<string, unknown>;

  if (record.type === 'preset' && isTeaRecommendationId(record.teaId)) {
    const tea = teaRecommendationContent[record.teaId];
    return {
      id: typeof record.id === 'string' ? record.id : record.teaId,
      type: 'preset',
      teaId: record.teaId,
      name: typeof record.name === 'string' ? record.name : tea.name,
      subtitle: typeof record.subtitle === 'string' ? record.subtitle : tea.subtitle,
      identityLine:
        typeof record.identityLine === 'string' ? record.identityLine : tea.identityLine,
      savedAt: typeof record.savedAt === 'string' ? record.savedAt : toTimestampString(new Date()),
    };
  }

  if (record.type === 'custom') {
    return {
      id: typeof record.id === 'string' ? record.id : `custom:${Date.now().toString(36)}`,
      type: 'custom',
      recommendationType:
        record.recommendationType === 'best' || record.recommendationType === 'fresh' || record.recommendationType === 'soft'
          ? record.recommendationType
          : 'best',
      displayName:
        typeof record.displayName === 'string'
          ? record.displayName
          : typeof record.title === 'string'
            ? record.title
            : '커스텀 블렌드',
      baseIngredientId:
        typeof record.baseIngredientId === 'string' ? record.baseIngredientId : customBlendBaseIngredientId,
      baseRatio: typeof record.baseRatio === 'number' ? record.baseRatio : undefined,
      blendRatios: normalizeBlendRatios(record.blendRatios),
      selectedIngredientIds: Array.isArray(record.selectedIngredientIds)
        ? record.selectedIngredientIds.filter((value): value is string => typeof value === 'string')
        : [],
      ingredientNames: Array.isArray(record.ingredientNames)
        ? record.ingredientNames.filter((value): value is string => typeof value === 'string')
        : [],
      toneLabel: typeof record.toneLabel === 'string' ? record.toneLabel : 'AI 블렌딩 제안',
      title:
        typeof record.title === 'string'
          ? record.title
          : typeof record.displayName === 'string'
            ? record.displayName
            : '커스텀 블렌드',
      summary:
        typeof record.summary === 'string'
          ? record.summary
          : typeof record.shortDescription === 'string'
            ? record.shortDescription
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
      detail:
        typeof record.detail === 'string'
          ? record.detail
          : typeof record.shortDescription === 'string'
            ? record.shortDescription
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
      tags: Array.isArray(record.tags)
        ? record.tags.filter((value): value is string => typeof value === 'string')
        : [],
      shortDescription:
        typeof record.shortDescription === 'string' ? record.shortDescription : '현재 흐름을 바탕으로 저장한 조합이에요.',
      contextLine: typeof record.contextLine === 'string' ? record.contextLine : '',
      savedAt: typeof record.savedAt === 'string' ? record.savedAt : toTimestampString(new Date()),
    };
  }

  return null;
}

export async function loadTeaBox(): Promise<SavedBlendItem[]> {
  const rawTeaBox = await readJson<unknown[]>(TEA_BOX_KEY, []);

  return rawTeaBox
    .map((item) => normalizeSavedBlendItem(item))
    .filter((item): item is SavedBlendItem => item !== null);
}

export async function saveTeaBox(items: SavedBlendItem[]): Promise<boolean> {
  return writeJson(TEA_BOX_KEY, items);
}
