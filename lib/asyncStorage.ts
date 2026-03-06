import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const rawValue = await AsyncStorage.getItem(key);
    return rawValue != null ? (JSON.parse(rawValue) as T) : fallback;
  } catch (error) {
    console.error(`Failed to read storage key: ${key}`, error);
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to write storage key: ${key}`, error);
    return false;
  }
}
