import AsyncStorage from '@react-native-async-storage/async-storage';
import { WellnessLog } from '@/types';

const LOGS_KEY = '@wellness_logs_v1';

export const saveLogs = async (logs: WellnessLog[]) => {
  try {
    const jsonValue = JSON.stringify(logs);
    await AsyncStorage.setItem(LOGS_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save wellness logs.', e);
  }
};

export const loadLogs = async (): Promise<WellnessLog[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(LOGS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load wellness logs.', e);
    return [];
  }
};
