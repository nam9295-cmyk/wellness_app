import { isDateWithinLastDays } from '@/lib/date';
import { generateOverallReportInsights, generateReportInsights } from '@/lib/reportInsights';
import { ExerciseState, EXERCISE_STATES, SleepState, WellnessLog } from '@/types';
import { getRecentLogsForReport, normalizeLogsForReport } from './reportLogUtils';

export interface ReportPeriodStats {
  logCount: number;
  avgMood: string;
  avgFatigue: string;
  frequentSleep: string;
  insights: string[];
}

export interface ReportOverview {
  weekly: ReportPeriodStats;
  overall: ReportPeriodStats;
}

function buildReportPeriodStats(logs: WellnessLog[], insights: string[]): ReportPeriodStats {
  const logCount = logs.length;
  if (logCount === 0) {
    return {
      logCount: 0,
      avgMood: '0.0',
      avgFatigue: '0.0',
      frequentSleep: '-',
      insights,
    };
  }

  const avgMood = (logs.reduce((acc, log) => acc + log.mood, 0) / logCount).toFixed(1);
  const avgFatigue = (logs.reduce((acc, log) => acc + log.fatigue, 0) / logCount).toFixed(1);
  const sleepCount: Partial<Record<SleepState, number>> = {};
  logs.forEach((log) => {
    sleepCount[log.sleep] = (sleepCount[log.sleep] || 0) + 1;
  });

  let maxSleepCount = 0;
  let frequentSleep: ReportPeriodStats['frequentSleep'] = '-';
  for (const [sleep, count] of Object.entries(sleepCount)) {
    if (count > maxSleepCount) {
      maxSleepCount = count;
      frequentSleep = sleep;
    }
  }

  const activeExerciseStates = new Set<ExerciseState>([EXERCISE_STATES[1], EXERCISE_STATES[2]]);
  const exerciseCount = logs.filter((log) => activeExerciseStates.has(log.exercise)).length;
  const exerciseRate = Math.round((exerciseCount / logCount) * 100);
  void exerciseRate;

  return {
    logCount,
    avgMood,
    avgFatigue,
    frequentSleep,
    insights,
  };
}

export function generateReportOverview(logs: WellnessLog[]): ReportOverview {
  const normalizedLogs = normalizeLogsForReport(logs);
  const weeklyLogs = getRecentLogsForReport(normalizedLogs);
  const actualRecent7DaysCount = normalizedLogs.filter((log) => isDateWithinLastDays(log.date, 7)).length;

  const weekly = buildReportPeriodStats(
    actualRecent7DaysCount > 0 ? weeklyLogs : [],
    generateReportInsights(normalizedLogs)
  );
  const overall = buildReportPeriodStats(
    normalizedLogs,
    generateOverallReportInsights(normalizedLogs)
  );

  return {
    weekly,
    overall,
  };
}
