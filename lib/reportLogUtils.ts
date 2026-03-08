import { isDateWithinLastDays } from '@/lib/date';
import { WellnessLog } from '@/types';
import { sortLogsByDateDesc } from './logUtils';

export function normalizeLogsForReport(logs: WellnessLog[]): WellnessLog[] {
  const latestLogByDate = new Map<string, WellnessLog>();

  sortLogsByDateDesc(logs).forEach((log) => {
    if (!latestLogByDate.has(log.date)) {
      latestLogByDate.set(log.date, log);
    }
  });

  return sortLogsByDateDesc(Array.from(latestLogByDate.values()));
}

export function getRecentLogsForReport(logs: WellnessLog[]): WellnessLog[] {
  const normalizedLogs = normalizeLogsForReport(logs);
  const recent7DaysLogs = normalizedLogs.filter((log) => isDateWithinLastDays(log.date, 7));

  if (recent7DaysLogs.length > 0) {
    return recent7DaysLogs;
  }

  return normalizedLogs.slice(0, 7);
}
