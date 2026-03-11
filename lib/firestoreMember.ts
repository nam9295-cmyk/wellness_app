import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebaseCollections';
import { getOrCreateMemberId } from '@/lib/memberIdentity';
import { DEFAULT_MEMBER_PROFILE, MemberProfile } from '@/types';

function toTimestampString(date: Date) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function parseBooleanEnv(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return fallback;
}

function normalizeRole(value: unknown, fallback: MemberProfile['role']): MemberProfile['role'] {
  if (
    value === 'member' ||
    value === 'tester' ||
    value === 'parent' ||
    value === 'orgAdmin' ||
    value === 'superAdmin'
  ) {
    return value;
  }

  return fallback;
}

export function getDefaultMemberProfile(): MemberProfile {
  const isTestAccount = parseBooleanEnv(process.env.EXPO_PUBLIC_IS_TEST_ACCOUNT, DEFAULT_MEMBER_PROFILE.isTestAccount);
  const role = normalizeRole(
    process.env.EXPO_PUBLIC_MEMBER_ROLE,
    isTestAccount ? 'tester' : DEFAULT_MEMBER_PROFILE.role
  );

  return {
    ...DEFAULT_MEMBER_PROFILE,
    organizationId:
      process.env.EXPO_PUBLIC_ORGANIZATION_ID?.trim() ||
      process.env.EXPO_PUBLIC_FIREBASE_ORGANIZATION_ID?.trim() ||
      process.env.EXPO_PUBLIC_FIREBASE_FACILITY_ID?.trim() ||
      DEFAULT_MEMBER_PROFILE.organizationId,
    organizationName:
      process.env.EXPO_PUBLIC_ORGANIZATION_NAME?.trim() || DEFAULT_MEMBER_PROFILE.organizationName,
    role,
    isTestAccount,
    testGroup: process.env.EXPO_PUBLIC_TEST_GROUP?.trim() || DEFAULT_MEMBER_PROFILE.testGroup,
    status: process.env.EXPO_PUBLIC_MEMBER_STATUS?.trim() || DEFAULT_MEMBER_PROFILE.status,
    lastActiveAt: toTimestampString(new Date()),
  };
}

export function mergeMemberProfile(profile: Partial<MemberProfile> | null | undefined): MemberProfile {
  return {
    ...getDefaultMemberProfile(),
    ...profile,
    role: normalizeRole(profile?.role, getDefaultMemberProfile().role),
    lastActiveAt: typeof profile?.lastActiveAt === 'string' && profile.lastActiveAt
      ? profile.lastActiveAt
      : getDefaultMemberProfile().lastActiveAt,
  };
}

export async function loadMemberProfileFromFirestore(): Promise<MemberProfile | null> {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  const memberId = await getOrCreateMemberId();
  const memberSnapshot = await getDoc(doc(db, COLLECTIONS.members, memberId));

  if (!memberSnapshot.exists()) {
    return null;
  }

  const data = memberSnapshot.data();

  return mergeMemberProfile({
    organizationId: typeof data.organizationId === 'string' ? data.organizationId : undefined,
    organizationName: typeof data.organizationName === 'string' ? data.organizationName : undefined,
    role: normalizeRole(data.role, getDefaultMemberProfile().role),
    isTestAccount: typeof data.isTestAccount === 'boolean' ? data.isTestAccount : undefined,
    testGroup: typeof data.testGroup === 'string' ? data.testGroup : data.testGroup === null ? null : undefined,
    status: typeof data.status === 'string' ? data.status : undefined,
    lastActiveAt: typeof data.lastActiveAt === 'string' ? data.lastActiveAt : undefined,
  });
}

export function createMemberIdentityPayload(profile: MemberProfile | null | undefined, nowLabel: string) {
  const resolvedProfile = mergeMemberProfile(profile);

  return {
    organizationId: resolvedProfile.organizationId,
    organizationName: resolvedProfile.organizationName,
    role: resolvedProfile.role,
    isTestAccount: resolvedProfile.isTestAccount,
    testGroup: resolvedProfile.testGroup,
    status: resolvedProfile.status,
    lastActiveAt: nowLabel,
    facilityId: resolvedProfile.organizationId,
  };
}
