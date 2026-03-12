import { TeaRecommendationId, teaRecommendationContent } from '@/lib/teaRecommendationContent';
import { CWaterBlendResult } from './cwaterBlendEngine';
import { CustomBlendOption } from './customBlendEngine';
import { customBlendBaseIngredientId } from './customBlendIngredients';
import { readJson, writeJson } from './asyncStorage';

const TEA_BOX_KEY = '@wellness_tea_box_v1';

interface SavedBlendBase {
  id: string;
  blendSource: 'legacy' | 'cwater';
  blendVersion: number;
  savedAt: string;
}

export interface PresetSavedBlendItem extends SavedBlendBase {
  type: 'preset';
  teaId: TeaRecommendationId;
  catalogId: TeaRecommendationId;
  name: string;
  subtitle: string;
  identityLine: string;
}

export interface CustomSavedBlendItem extends SavedBlendBase {
  type: 'custom';
  recommendationType: 'best' | 'fresh' | 'soft';
  catalogId: string;
  cacaoNibLevel: number | null;
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
}

export interface CWaterSavedBlendItem extends SavedBlendBase {
  type: 'cwater';
  recommendationType: 'cwater';
  catalogId: string;
  teaIds: string[];
  cacaoNibLevel: number | null;
  displayName: string;
  title: string;
  summary: string;
  detail: string;
  tags: string[];
  ingredientNames: string[];
  toneLabel: string;
  shortDescription: string;
  contextLine: string;
}

export type SavedBlendItem = PresetSavedBlendItem | CustomSavedBlendItem | CWaterSavedBlendItem;

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
    blendSource: 'legacy',
    blendVersion: 1,
    teaId,
    catalogId: teaId,
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
    blendSource: 'legacy',
    blendVersion: 1,
    recommendationType: option.recommendationType,
    catalogId: option.ingredientIds.join(':'),
    cacaoNibLevel: option.baseRatio ?? null,
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

export function createCWaterSavedBlendItem(result: CWaterBlendResult, cacaoNibLevel: number | null = null): CWaterSavedBlendItem {
  const savedAt = toTimestampString(new Date());
  const toneLabel =
    result.dominantTags[0] === 'bright' || result.dominantTags[0] === 'citrus'
      ? '브라이트 페어'
      : result.dominantTags[0] === 'soft' || result.dominantTags[0] === 'calm'
        ? '소프트 페어'
        : result.dominantTags[0] === 'focus' || result.dominantTags[0] === 'deep'
          ? '포커스 페어'
          : 'C.WATER 조합';

  return {
    id: `cwater:${result.id}`,
    type: 'cwater',
    blendSource: 'cwater',
    blendVersion: 1,
    recommendationType: 'cwater',
    catalogId: result.id,
    teaIds: result.teaIds,
    cacaoNibLevel,
    displayName: result.displayName,
    title: result.displayName,
    summary: result.summary,
    detail: result.detail,
    tags: result.dominantTags,
    ingredientNames: result.teas.map((tea) => tea.displayName),
    toneLabel,
    shortDescription: result.summary,
    contextLine: result.matchedNotes[0] ?? result.teas.map((tea) => tea.noteLine).join(' · '),
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
      blendSource: 'legacy',
      blendVersion: typeof record.blendVersion === 'number' ? record.blendVersion : 1,
      teaId: record.teaId,
      catalogId:
        typeof record.catalogId === 'string' && isTeaRecommendationId(record.catalogId)
          ? record.catalogId
          : record.teaId,
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
      blendSource: 'legacy',
      blendVersion: typeof record.blendVersion === 'number' ? record.blendVersion : 1,
      recommendationType:
        record.recommendationType === 'best' || record.recommendationType === 'fresh' || record.recommendationType === 'soft'
          ? record.recommendationType
          : 'best',
      catalogId: typeof record.catalogId === 'string' ? record.catalogId : (typeof record.id === 'string' ? record.id : 'custom'),
      cacaoNibLevel:
        typeof record.cacaoNibLevel === 'number'
          ? record.cacaoNibLevel
          : typeof record.baseRatio === 'number'
            ? record.baseRatio
            : null,
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

  if (record.type === 'cwater') {
    return {
      id: typeof record.id === 'string' ? record.id : `cwater:${Date.now().toString(36)}`,
      type: 'cwater',
      blendSource: 'cwater',
      blendVersion: typeof record.blendVersion === 'number' ? record.blendVersion : 1,
      recommendationType: 'cwater',
      catalogId:
        typeof record.catalogId === 'string'
          ? record.catalogId
          : typeof record.id === 'string'
            ? record.id.replace(/^cwater:/, '')
            : 'cwater',
      teaIds: Array.isArray(record.teaIds)
        ? record.teaIds.filter((value): value is string => typeof value === 'string')
        : [],
      cacaoNibLevel: typeof record.cacaoNibLevel === 'number' ? record.cacaoNibLevel : null,
      displayName:
        typeof record.displayName === 'string'
          ? record.displayName
          : typeof record.title === 'string'
            ? record.title
            : 'C.WATER 조합',
      title:
        typeof record.title === 'string'
          ? record.title
          : typeof record.displayName === 'string'
            ? record.displayName
            : 'C.WATER 조합',
      summary:
        typeof record.summary === 'string'
          ? record.summary
          : typeof record.shortDescription === 'string'
            ? record.shortDescription
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
      detail:
        typeof record.detail === 'string'
          ? record.detail
          : typeof record.summary === 'string'
            ? record.summary
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
      tags: Array.isArray(record.tags)
        ? record.tags.filter((value): value is string => typeof value === 'string')
        : [],
      ingredientNames: Array.isArray(record.ingredientNames)
        ? record.ingredientNames.filter((value): value is string => typeof value === 'string')
        : [],
      toneLabel: typeof record.toneLabel === 'string' ? record.toneLabel : 'C.WATER 조합',
      shortDescription:
        typeof record.shortDescription === 'string'
          ? record.shortDescription
          : typeof record.summary === 'string'
            ? record.summary
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
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
