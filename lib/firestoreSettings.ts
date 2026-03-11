import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebaseCollections';
import { createMemberIdentityPayload, mergeMemberProfile } from '@/lib/firestoreMember';
import { getOrCreateMemberId } from '@/lib/memberIdentity';
import { DEFAULT_USER_SETTINGS, MemberProfile, UserSettings } from '@/types';

interface SyncUserSettingsToFirestoreInput {
  settings: UserSettings;
  memberProfile?: MemberProfile | null;
}

function toTimestampString(date: Date) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

export async function syncUserSettingsToFirestore({
  settings,
  memberProfile,
}: SyncUserSettingsToFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const nowLabel = toTimestampString(new Date());
  const memberName = settings.nickname.trim() || '앱 사용자';
  const resolvedProfile = mergeMemberProfile(memberProfile);

  await setDoc(
    doc(db, COLLECTIONS.members, memberId),
    {
      name: memberName,
      ...createMemberIdentityPayload(resolvedProfile, nowLabel),
      updatedAt: nowLabel,
      settings: {
        nickname: memberName,
        goal: settings.goal,
        notificationEnabled: settings.notificationEnabled,
        notificationTime: settings.notificationTime,
        useMenstrualCycle: settings.useMenstrualCycle,
        syncedAt: nowLabel,
      },
    },
    { merge: true }
  );

  return {
    synced: true,
    memberId,
  };
}

export async function loadUserSettingsFromFirestore(): Promise<UserSettings | null> {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  const memberId = await getOrCreateMemberId();
  const memberSnapshot = await getDoc(doc(db, COLLECTIONS.members, memberId));

  if (!memberSnapshot.exists()) {
    return null;
  }

  const data = memberSnapshot.data();
  const settings = data.settings;

  if (!settings) {
    return null;
  }

  return {
    ...DEFAULT_USER_SETTINGS,
    nickname: typeof settings.nickname === 'string' ? settings.nickname : DEFAULT_USER_SETTINGS.nickname,
    goal: typeof settings.goal === 'string' ? settings.goal : DEFAULT_USER_SETTINGS.goal,
    notificationEnabled:
      typeof settings.notificationEnabled === 'boolean'
        ? settings.notificationEnabled
        : DEFAULT_USER_SETTINGS.notificationEnabled,
    notificationTime:
      typeof settings.notificationTime === 'string'
        ? settings.notificationTime
        : DEFAULT_USER_SETTINGS.notificationTime,
    useMenstrualCycle:
      typeof settings.useMenstrualCycle === 'boolean'
        ? settings.useMenstrualCycle
        : DEFAULT_USER_SETTINGS.useMenstrualCycle,
  };
}
