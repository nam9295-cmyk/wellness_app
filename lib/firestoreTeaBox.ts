import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { SUBCOLLECTIONS, COLLECTIONS } from '@/lib/firebaseCollections';
import { getOrCreateMemberId } from '@/lib/memberIdentity';
import { TeaRecommendationId, teaRecommendationContent } from '@/lib/teaRecommendationContent';
import {
  createCustomBlendItemId,
  createCustomSavedBlendItem,
  createPresetSavedBlendItem,
  SavedBlendItem,
} from './teaBoxStorage';
import { CustomBlendOption } from './customBlendEngine';

interface SyncSavedTeaToFirestoreInput {
  teaId: TeaRecommendationId;
}

interface SyncSavedCustomBlendToFirestoreInput {
  option: CustomBlendOption;
}

interface SyncRemovedBlendFromFirestoreInput {
  itemId: string;
}

function toTimestampString(date: Date) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function isTeaRecommendationId(value: unknown): value is TeaRecommendationId {
  return typeof value === 'string' && value in teaRecommendationContent;
}

function toSavedBlendItem(data: Record<string, unknown>, docId: string): SavedBlendItem | null {
  if (data.type === 'custom') {
    return {
      id: docId,
      type: 'custom',
      recommendationType:
        data.recommendationType === 'best' || data.recommendationType === 'fresh' || data.recommendationType === 'soft'
          ? data.recommendationType
          : 'best',
      displayName:
        typeof data.displayName === 'string'
          ? data.displayName
          : typeof data.title === 'string'
            ? data.title
            : '커스텀 블렌드',
      baseIngredientId:
        typeof data.baseIngredientId === 'string' ? data.baseIngredientId : 'cacaoNib',
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
}: SyncSavedTeaToFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());
  const presetItem = createPresetSavedBlendItem(teaId);

  await setDoc(
    doc(collection(db, SUBCOLLECTIONS.savedTeas(memberId)), presetItem.id),
    {
      type: 'preset',
      teaId: presetItem.teaId,
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
}: SyncSavedCustomBlendToFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());
  const customItem = createCustomSavedBlendItem(option);

  await setDoc(
    doc(collection(db, SUBCOLLECTIONS.savedTeas(memberId)), createCustomBlendItemId(option)),
    {
      type: 'custom',
      recommendationType: customItem.recommendationType,
      displayName: customItem.displayName,
      baseIngredientId: customItem.baseIngredientId,
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

export async function syncRemovedBlendFromFirestore({
  itemId,
}: SyncRemovedBlendFromFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());

  await deleteDoc(doc(collection(db, SUBCOLLECTIONS.savedTeas(memberId)), itemId));

  await setDoc(
    doc(db, COLLECTIONS.members, memberId),
    {
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
