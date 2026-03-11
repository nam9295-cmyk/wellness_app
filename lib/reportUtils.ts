import { isDateWithinLastDays } from '@/lib/date';
import { generateOverallReportInsights, generateReportInsights } from '@/lib/reportInsights';
import { ExerciseState, EXERCISE_STATES, SleepState, WellnessLog } from '@/types';
import { getRecentLogsForReport, normalizeLogsForReport } from './reportLogUtils';
import {
  calculateMentalRhythmScore,
  calculatePhysicalRhythmScore,
  normalizeFatigueScore,
  normalizeMoodScore,
  normalizeSleepScore,
  normalizeStressScore,
} from './wellnessScoring';

export interface ReportPeriodStats {
  logCount: number;
  avgMood: string;
  avgFatigue: string;
  avgStress: string;
  physicalRhythm: string;
  mentalRhythm: string;
  frequentSleep: string;
  insights: string[];
}

export interface ReportOverview {
  daily: ReportPeriodStats;
  weekly: ReportPeriodStats;
  monthly: ReportPeriodStats;
  overall: ReportPeriodStats;
}

function buildReportPeriodStats(logs: WellnessLog[], insights: string[]): ReportPeriodStats {
  const logCount = logs.length;
  if (logCount === 0) {
    return {
      logCount: 0,
      avgMood: '0.0',
      avgFatigue: '0.0',
      avgStress: '0.0',
      physicalRhythm: '0.0',
      mentalRhythm: '0.0',
      frequentSleep: '-',
      insights,
    };
  }

  const avgMood = (
    logs.reduce((acc, log) => acc + normalizeMoodScore(log.mood), 0) / logCount
  ).toFixed(1);
  const avgFatigue = (
    logs.reduce((acc, log) => acc + normalizeFatigueScore(log.fatigue), 0) / logCount
  ).toFixed(1);
  const avgStress = (
    logs.reduce((acc, log) => acc + normalizeStressScore(log.stress), 0) / logCount
  ).toFixed(1);
  const sleepCount: Partial<Record<SleepState, number>> = {};
  logs.forEach((log) => {
    const normalizedSleep = normalizeSleepScore(log.sleep);
    const sleepLabel = (['매우 부족', '부족', '보통', '좋음', '매우 좋음'][normalizedSleep - 1] ??
      '보통') as SleepState;
    sleepCount[sleepLabel] = (sleepCount[sleepLabel] || 0) + 1;
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
  const physicalRhythm = (
    logs.reduce((acc, log) => acc + calculatePhysicalRhythmScore(log), 0) / logCount
  ).toFixed(1);
  const mentalRhythm = (
    logs.reduce((acc, log) => acc + calculateMentalRhythmScore(log), 0) / logCount
  ).toFixed(1);

  return {
    logCount,
    avgMood,
    avgFatigue,
    avgStress,
    physicalRhythm,
    mentalRhythm,
    frequentSleep,
    insights,
  };
}

function getLogsForLastDays(logs: WellnessLog[], days: number): WellnessLog[] {
  return normalizeLogsForReport(logs).filter((log) => isDateWithinLastDays(log.date, days));
}

export function generateReportOverview(logs: WellnessLog[]): ReportOverview {
  const normalizedLogs = normalizeLogsForReport(logs);
  const dailyLogs = normalizedLogs.slice(0, 1);
  const weeklyLogs = getRecentLogsForReport(normalizedLogs);
  const monthlyLogs = getLogsForLastDays(normalizedLogs, 30);
  const actualRecent7DaysCount = normalizedLogs.filter((log) => isDateWithinLastDays(log.date, 7)).length;

  const daily = buildReportPeriodStats(
    dailyLogs,
    generateReportInsights(dailyLogs)
  );
  const weekly = buildReportPeriodStats(
    actualRecent7DaysCount > 0 ? weeklyLogs : [],
    generateReportInsights(normalizedLogs)
  );
  const monthly = buildReportPeriodStats(
    monthlyLogs.length > 0 ? monthlyLogs : normalizedLogs.slice(0, 30),
    generateOverallReportInsights(monthlyLogs.length > 0 ? monthlyLogs : normalizedLogs.slice(0, 30))
  );
  const overall = buildReportPeriodStats(
    normalizedLogs,
    generateOverallReportInsights(normalizedLogs)
  );

  return {
    daily,
    weekly,
    monthly,
    overall,
  };
}
