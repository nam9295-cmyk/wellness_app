import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { SUBCOLLECTIONS, COLLECTIONS } from '@/lib/firebaseCollections';
import { getOrCreateMemberId } from '@/lib/memberIdentity';
import { TeaRecommendationContent, TeaRecommendationId, teaRecommendationContent } from '@/lib/teaRecommendationContent';

interface SyncSavedTeaToFirestoreInput {
  teaId: TeaRecommendationId;
}

interface SyncRemovedTeaFromFirestoreInput {
  teaId: TeaRecommendationId;
}

function toTimestampString(date: Date) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function getTeaContent(teaId: TeaRecommendationId): TeaRecommendationContent {
  return teaRecommendationContent[teaId];
}

export async function syncSavedTeaToFirestore({
  teaId,
}: SyncSavedTeaToFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());
  const tea = getTeaContent(teaId);

  await setDoc(
    doc(collection(db, SUBCOLLECTIONS.savedTeas(memberId)), teaId),
    {
      teaId,
      name: tea.name,
      subtitle: tea.subtitle,
      identityLine: tea.identityLine,
      savedAt: nowLabel,
      updatedAt: nowLabel,
    },
    { merge: true }
  );

  await setDoc(
    doc(db, COLLECTIONS.members, memberId),
    {
      updatedAt: nowLabel,
      lastSavedTeaId: teaId,
      lastSavedTeaName: tea.name,
    },
    { merge: true }
  );

  return {
    synced: true,
    memberId,
  };
}

export async function syncRemovedTeaFromFirestore({
  teaId,
}: SyncRemovedTeaFromFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());

  await deleteDoc(doc(collection(db, SUBCOLLECTIONS.savedTeas(memberId)), teaId));

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

export async function loadTeaBoxFromFirestore(): Promise<TeaRecommendationId[] | null> {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  const memberId = await getOrCreateMemberId();
  const snapshot = await getDocs(collection(db, SUBCOLLECTIONS.savedTeas(memberId)));

  if (snapshot.empty) {
    return [];
  }

  const savedTeaIds = snapshot.docs
    .map((savedTeaDoc) => savedTeaDoc.id)
    .filter((teaId): teaId is TeaRecommendationId => teaId in teaRecommendationContent);

  return savedTeaIds;
}
