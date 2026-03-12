import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { SUBCOLLECTIONS, COLLECTIONS } from '@/lib/firebaseCollections';
import { createMemberIdentityPayload, mergeMemberProfile } from '@/lib/firestoreMember';
import { getOrCreateMemberId } from '@/lib/memberIdentity';
import { CWaterBlendResult } from '@/lib/cwaterBlendEngine';
import { TeaRecommendationId, teaRecommendationContent } from '@/lib/teaRecommendationContent';
import { MemberProfile } from '@/types';
import {
  createCWaterSavedBlendItem,
  createCustomBlendItemId,
  createCustomSavedBlendItem,
  createPresetSavedBlendItem,
  SavedBlendItem,
} from './teaBoxStorage';
import { CustomBlendOption } from './customBlendEngine';

interface SyncSavedTeaToFirestoreInput {
  teaId: TeaRecommendationId;
  memberProfile?: MemberProfile | null;
}

interface SyncSavedCustomBlendToFirestoreInput {
  option: CustomBlendOption;
  memberProfile?: MemberProfile | null;
}

interface SyncSavedCWaterBlendToFirestoreInput {
  result: CWaterBlendResult;
  cacaoNibLevel?: number | null;
  teaRatios?: Record<string, number> | null;
  memberProfile?: MemberProfile | null;
}

interface SyncRemovedBlendFromFirestoreInput {
  itemId: string;
  memberProfile?: MemberProfile | null;
}

function toTimestampString(date: Date) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
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

function toSavedBlendItem(data: Record<string, unknown>, docId: string): SavedBlendItem | null {
  if (data.type === 'cwater') {
    return {
      id: docId,
      type: 'cwater',
      blendSource: 'cwater',
      blendVersion: typeof data.blendVersion === 'number' ? data.blendVersion : 1,
      recommendationType: 'cwater',
      catalogId:
        typeof data.catalogId === 'string'
          ? data.catalogId
          : docId.replace(/^cwater:/, ''),
      teaIds: Array.isArray(data.teaIds)
        ? data.teaIds.filter((value): value is string => typeof value === 'string')
        : [],
      cacaoNibLevel:
        typeof data.cacaoNibLevel === 'number'
          ? data.cacaoNibLevel
          : null,
      teaRatios: normalizeBlendRatios(data.teaRatios) ?? null,
      displayName:
        typeof data.displayName === 'string'
          ? data.displayName
          : typeof data.title === 'string'
            ? data.title
            : 'C.WATER 조합',
      title:
        typeof data.title === 'string'
          ? data.title
          : typeof data.displayName === 'string'
            ? data.displayName
            : 'C.WATER 조합',
      summary:
        typeof data.summary === 'string'
          ? data.summary
          : typeof data.shortDescription === 'string'
            ? data.shortDescription
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
      detail:
        typeof data.detail === 'string'
          ? data.detail
          : typeof data.summary === 'string'
            ? data.summary
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
      tags: Array.isArray(data.tags)
        ? data.tags.filter((value): value is string => typeof value === 'string')
        : [],
      ingredientNames: Array.isArray(data.ingredientNames)
        ? data.ingredientNames.filter((value): value is string => typeof value === 'string')
        : [],
      toneLabel: typeof data.toneLabel === 'string' ? data.toneLabel : 'C.WATER 조합',
      shortDescription:
        typeof data.shortDescription === 'string'
          ? data.shortDescription
          : typeof data.summary === 'string'
            ? data.summary
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
      contextLine: typeof data.contextLine === 'string' ? data.contextLine : '',
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : toTimestampString(new Date()),
    };
  }

  if (data.type === 'custom') {
    return {
      id: docId,
      type: 'custom',
      blendSource: 'legacy',
      blendVersion: typeof data.blendVersion === 'number' ? data.blendVersion : 1,
      recommendationType:
        data.recommendationType === 'best' || data.recommendationType === 'fresh' || data.recommendationType === 'soft'
          ? data.recommendationType
          : 'best',
      catalogId: typeof data.catalogId === 'string' ? data.catalogId : docId,
      cacaoNibLevel:
        typeof data.cacaoNibLevel === 'number'
          ? data.cacaoNibLevel
          : typeof data.baseRatio === 'number'
            ? data.baseRatio
            : null,
      displayName:
        typeof data.displayName === 'string'
          ? data.displayName
          : typeof data.title === 'string'
            ? data.title
            : '커스텀 블렌드',
      baseIngredientId:
        typeof data.baseIngredientId === 'string' ? data.baseIngredientId : 'cacaoNib',
      baseRatio: typeof data.baseRatio === 'number' ? data.baseRatio : undefined,
      blendRatios: normalizeBlendRatios(data.blendRatios),
      selectedIngredientIds: Array.isArray(data.selectedIngredientIds)
        ? data.selectedIngredientIds.filter((value): value is string => typeof value === 'string')
        : [],
      ingredientNames: Array.isArray(data.ingredientNames)
        ? data.ingredientNames.filter((value): value is string => typeof value === 'string')
        : [],
      toneLabel: typeof data.toneLabel === 'string' ? data.toneLabel : 'AI 블렌딩 제안',
      title: typeof data.title === 'string' ? data.title : '커스텀 블렌드',
      summary:
        typeof data.summary === 'string'
          ? data.summary
          : typeof data.shortDescription === 'string'
            ? data.shortDescription
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
      detail:
        typeof data.detail === 'string'
          ? data.detail
          : typeof data.shortDescription === 'string'
            ? data.shortDescription
            : '현재 흐름을 바탕으로 저장한 조합이에요.',
      tags: Array.isArray(data.tags)
        ? data.tags.filter((value): value is string => typeof value === 'string')
        : [],
      shortDescription:
        typeof data.shortDescription === 'string' ? data.shortDescription : '현재 흐름을 바탕으로 저장한 조합이에요.',
      contextLine: typeof data.contextLine === 'string' ? data.contextLine : '',
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : toTimestampString(new Date()),
    };
  }

  const teaId = typeof data.teaId === 'string' ? data.teaId : docId;

  if (!isTeaRecommendationId(teaId)) {
    return null;
  }

  const presetItem = createPresetSavedBlendItem(teaId);

  return {
    ...presetItem,
    id: docId,
    name: typeof data.name === 'string' ? data.name : presetItem.name,
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : presetItem.subtitle,
    identityLine:
      typeof data.identityLine === 'string' ? data.identityLine : presetItem.identityLine,
    savedAt: typeof data.savedAt === 'string' ? data.savedAt : presetItem.savedAt,
  };
}

export async function syncSavedTeaToFirestore({
  teaId,
  memberProfile,
}: SyncSavedTeaToFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());
  const presetItem = createPresetSavedBlendItem(teaId);
  const resolvedProfile = mergeMemberProfile(memberProfile);

  await setDoc(
    doc(collection(db, SUBCOLLECTIONS.savedTeas(memberId)), presetItem.id),
    {
      type: 'preset',
      blendSource: presetItem.blendSource,
      blendVersion: presetItem.blendVersion,
      teaId: presetItem.teaId,
      catalogId: presetItem.catalogId,
      name: presetItem.name,
      subtitle: presetItem.subtitle,
      identityLine: presetItem.identityLine,
      savedAt: presetItem.savedAt,
      updatedAt: nowLabel,
    },
    { merge: true }
  );

  await setDoc(
    doc(db, COLLECTIONS.members, memberId),
    {
      ...createMemberIdentityPayload(resolvedProfile, nowLabel),
      updatedAt: nowLabel,
      lastSavedTeaId: teaId,
      lastSavedTeaName: presetItem.name,
    },
    { merge: true }
  );

  return {
    synced: true,
    memberId,
  };
}

export async function syncSavedCustomBlendToFirestore({
  option,
  memberProfile,
}: SyncSavedCustomBlendToFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());
  const customItem = createCustomSavedBlendItem(option);
  const resolvedProfile = mergeMemberProfile(memberProfile);

  await setDoc(
    doc(collection(db, SUBCOLLECTIONS.savedTeas(memberId)), createCustomBlendItemId(option)),
    {
      type: 'custom',
      blendSource: customItem.blendSource,
      blendVersion: customItem.blendVersion,
      recommendationType: customItem.recommendationType,
      catalogId: customItem.catalogId,
      cacaoNibLevel: customItem.cacaoNibLevel,
      displayName: customItem.displayName,
      baseIngredientId: customItem.baseIngredientId,
      baseRatio: customItem.baseRatio,
      blendRatios: customItem.blendRatios,
      selectedIngredientIds: customItem.selectedIngredientIds,
      ingredientNames: customItem.ingredientNames,
      toneLabel: customItem.toneLabel,
      title: customItem.title,
      summary: customItem.summary,
      detail: customItem.detail,
      tags: customItem.tags,
      shortDescription: customItem.shortDescription,
      contextLine: customItem.contextLine,
      savedAt: customItem.savedAt,
      updatedAt: nowLabel,
    },
    { merge: true }
  );

  await setDoc(
    doc(db, COLLECTIONS.members, memberId),
    {
      ...createMemberIdentityPayload(resolvedProfile, nowLabel),
      updatedAt: nowLabel,
      lastSavedTeaId: customItem.id,
      lastSavedTeaName: customItem.title,
    },
    { merge: true }
  );

  return {
    synced: true,
    memberId,
  };
}

export async function syncSavedCWaterBlendToFirestore({
  result,
  cacaoNibLevel = null,
  teaRatios = null,
  memberProfile,
}: SyncSavedCWaterBlendToFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());
  const cwaterItem = createCWaterSavedBlendItem(result, cacaoNibLevel, teaRatios);
  const resolvedProfile = mergeMemberProfile(memberProfile);

  await setDoc(
    doc(collection(db, SUBCOLLECTIONS.savedTeas(memberId)), cwaterItem.id),
    {
      type: 'cwater',
      blendSource: cwaterItem.blendSource,
      blendVersion: cwaterItem.blendVersion,
      recommendationType: cwaterItem.recommendationType,
      catalogId: cwaterItem.catalogId,
      teaIds: cwaterItem.teaIds,
      cacaoNibLevel: cwaterItem.cacaoNibLevel,
      teaRatios: cwaterItem.teaRatios,
      displayName: cwaterItem.displayName,
      title: cwaterItem.title,
      summary: cwaterItem.summary,
      detail: cwaterItem.detail,
      tags: cwaterItem.tags,
      ingredientNames: cwaterItem.ingredientNames,
      toneLabel: cwaterItem.toneLabel,
      shortDescription: cwaterItem.shortDescription,
      contextLine: cwaterItem.contextLine,
      savedAt: cwaterItem.savedAt,
      updatedAt: nowLabel,
    },
    { merge: true }
  );

  await setDoc(
    doc(db, COLLECTIONS.members, memberId),
    {
      ...createMemberIdentityPayload(resolvedProfile, nowLabel),
      updatedAt: nowLabel,
      lastSavedTeaId: cwaterItem.id,
      lastSavedTeaName: cwaterItem.displayName,
    },
    { merge: true }
  );

  return {
    synced: true,
    memberId,
  };
}

export async function syncRemovedBlendFromFirestore({
  itemId,
  memberProfile,
}: SyncRemovedBlendFromFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());
  const resolvedProfile = mergeMemberProfile(memberProfile);

  await deleteDoc(doc(collection(db, SUBCOLLECTIONS.savedTeas(memberId)), itemId));

  await setDoc(
    doc(db, COLLECTIONS.members, memberId),
    {
      ...createMemberIdentityPayload(resolvedProfile, nowLabel),
      updatedAt: nowLabel,
    },
    { merge: true }
  );

  return {
    synced: true,
    memberId,
  };
}

export async function loadTeaBoxFromFirestore(): Promise<SavedBlendItem[] | null> {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  const memberId = await getOrCreateMemberId();
  const snapshot = await getDocs(collection(db, SUBCOLLECTIONS.savedTeas(memberId)));

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs
    .map((savedTeaDoc) => toSavedBlendItem(savedTeaDoc.data() as Record<string, unknown>, savedTeaDoc.id))
    .filter((item): item is SavedBlendItem => item !== null);
}
