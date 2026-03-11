import { DEFAULT_MEMBER_PROFILE, MemberProfile } from '@/types';
import { readJson, writeJson } from './asyncStorage';

const MEMBER_PROFILE_KEY = '@wellness_member_profile_v1';

export async function loadMemberProfile(): Promise<MemberProfile | null> {
  const profile = await readJson<MemberProfile | null>(MEMBER_PROFILE_KEY, null);

  if (!profile) {
    return null;
  }

  return {
    ...DEFAULT_MEMBER_PROFILE,
    ...profile,
  };
}

export async function saveMemberProfile(profile: MemberProfile): Promise<boolean> {
  return writeJson(MEMBER_PROFILE_KEY, profile);
}
