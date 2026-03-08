import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMBER_ID_KEY = '@wellness_member_id_v1';

function createLocalMemberId() {
  return `member_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getOrCreateMemberId(): Promise<string> {
  const configuredMemberId = process.env.EXPO_PUBLIC_FIREBASE_MEMBER_ID?.trim();

  if (configuredMemberId) {
    return configuredMemberId;
  }

  const storedMemberId = await AsyncStorage.getItem(MEMBER_ID_KEY);
  if (storedMemberId) {
    return storedMemberId;
  }

  const nextMemberId = createLocalMemberId();
  await AsyncStorage.setItem(MEMBER_ID_KEY, nextMemberId);
  return nextMemberId;
}
