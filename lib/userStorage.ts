import { DEFAULT_USER_SETTINGS, UserSettings } from '@/types';
import { readJson, writeJson } from './asyncStorage';

const SETTINGS_KEY = '@wellness_user_settings';

export const saveUserSettings = async (settings: UserSettings): Promise<boolean> => {
  return writeJson(SETTINGS_KEY, settings);
};

export const loadUserSettings = async (): Promise<UserSettings | null> => {
  const settings = await readJson<UserSettings | null>(SETTINGS_KEY, null);

  if (!settings) {
    return null;
  }

  return {
    ...DEFAULT_USER_SETTINGS,
    ...settings,
  };
};
