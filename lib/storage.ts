import { WellnessLog } from '@/types';
import { readJson, writeJson } from './asyncStorage';

const LOGS_KEY = '@wellness_logs_v1';

export const saveLogs = async (logs: WellnessLog[]): Promise<boolean> => {
  return writeJson(LOGS_KEY, logs);
};

export const loadLogs = async (): Promise<WellnessLog[]> => {
  return readJson<WellnessLog[]>(LOGS_KEY, []);
};
