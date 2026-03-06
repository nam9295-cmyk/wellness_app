import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '@/types';

const SETTINGS_KEY = '@wellness_user_settings';

export const saveUserSettings = async (settings: UserSettings): Promise<boolean> => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
    return true;
  } catch (e) {
    console.error('Failed to save user settings:', e);
    return false;
  }
};

export const loadUserSettings = async (): Promise<UserSettings | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to load user settings:', e);
    return null;
  }
};
