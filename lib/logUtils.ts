import { getTodayDateString } from '@/lib/date';
import { WellnessLog, WellnessLogInput } from '@/types';

export function sortLogsByDateDesc(logs: WellnessLog[]): WellnessLog[] {
  return [...logs].sort((a, b) => b.date.localeCompare(a.date));
}

export function createWellnessLog(log: WellnessLogInput): WellnessLog {
  return {
    ...log,
    id: Date.now().toString(),
  };
}

export function upsertLog(logs: WellnessLog[], nextLog: WellnessLog): WellnessLog[] {
  const existingIndex = logs.findIndex((log) => log.date === nextLog.date);

  if (existingIndex >= 0) {
    const updatedLogs = [...logs];
    updatedLogs[existingIndex] = nextLog;
    return sortLogsByDateDesc(updatedLogs);
  }

  return sortLogsByDateDesc([nextLog, ...logs]);
}

export function findLogByDate(logs: WellnessLog[], date: string): WellnessLog | undefined {
  return logs.find((log) => log.date === date);
}

export function findTodayLog(logs: WellnessLog[]): WellnessLog | undefined {
  return findLogByDate(logs, getTodayDateString());
}
