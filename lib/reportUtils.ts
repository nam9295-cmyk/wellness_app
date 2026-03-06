import { isDateWithinLastDays } from '@/lib/date';
import { generateReportInsights } from '@/lib/reportInsights';
import { ExerciseState, EXERCISE_STATES, SleepState, WellnessLog } from '@/types';

export interface ReportStats {
  totalLogs: number;
  recent7DaysLogs: number;
  avgMood: string;
  avgFatigue: string;
  frequentSleep: string;
  insights: string[];
}

export function generateReportStats(logs: WellnessLog[]): ReportStats {
  const totalLogs = logs.length;
  if (totalLogs === 0) {
    return {
      totalLogs: 0,
      recent7DaysLogs: 0,
      avgMood: '0.0',
      avgFatigue: '0.0',
      frequentSleep: '-',
      insights: generateReportInsights(logs)
    };
  }

  // 1. 점수 평균 계산
  const avgMood = (logs.reduce((acc, log) => acc + log.mood, 0) / totalLogs).toFixed(1);
  const avgFatigue = (logs.reduce((acc, log) => acc + log.fatigue, 0) / totalLogs).toFixed(1);

  // 2. 최근 7일 기록 여부 계산
  const recent7DaysLogs = logs.filter((log) => isDateWithinLastDays(log.date, 7)).length;

  // 3. 가장 자주 선택된 수면 상태
  const sleepCount: Partial<Record<SleepState, number>> = {};
  logs.forEach((log) => {
    sleepCount[log.sleep] = (sleepCount[log.sleep] || 0) + 1;
  });
  let maxSleepCount = 0;
  let frequentSleep: ReportStats['frequentSleep'] = '-';
  for (const [sleep, count] of Object.entries(sleepCount)) {
    if (count > maxSleepCount) {
      maxSleepCount = count;
      frequentSleep = sleep;
    }
  }

  // 4. 운동 횟수 파악
  const activeExerciseStates = new Set<ExerciseState>([EXERCISE_STATES[1], EXERCISE_STATES[2]]);
  const exerciseCount = logs.filter((log) => activeExerciseStates.has(log.exercise)).length;
  const exerciseRate = Math.round((exerciseCount / totalLogs) * 100);

  const insights = generateReportInsights(logs);

  return {
    totalLogs,
    recent7DaysLogs,
    avgMood,
    avgFatigue,
    frequentSleep,
    insights
  };
}
