import { isDateWithinLastDays } from '@/lib/date';
import { WellnessLog } from '@/types';

function getInsightTargetLogs(logs: WellnessLog[]): WellnessLog[] {
  const recent7DaysLogs = logs.filter((log) => isDateWithinLastDays(log.date, 7));
  return recent7DaysLogs.length > 0 ? recent7DaysLogs : logs.slice(0, 7);
}

export function generateReportInsights(logs: WellnessLog[]): string[] {
  if (logs.length === 0) {
    return ['아직 기록이 충분하지 않아요. 오늘의 웰니스를 기록해 볼까요?'];
  }

  const targetLogs = getInsightTargetLogs(logs);
  const insights: string[] = [];

  const lowSleepCount = targetLogs.filter((log) => log.sleep === '매우 부족' || log.sleep === '부족').length;
  const lowMoodCount = targetLogs.filter((log) => log.mood <= 2).length;
  const highFatigueCount = targetLogs.filter((log) => log.fatigue <= 2).length;
  const activeExerciseCount = targetLogs.filter((log) => log.exercise !== '안 함').length;
  const avgMood = targetLogs.reduce((sum, log) => sum + log.mood, 0) / targetLogs.length;
  const avgFatigue = targetLogs.reduce((sum, log) => sum + log.fatigue, 0) / targetLogs.length;

  if (lowSleepCount >= 2) {
    insights.push('최근 수면 부족 기록이 자주 보여요.');
  }

  if (avgMood >= 3.5 && lowMoodCount === 0) {
    insights.push('기분 점수는 비교적 안정적인 흐름이에요.');
  } else if (lowMoodCount >= 2) {
    insights.push('기분이 가라앉는 날이 이어져 보여요. 무리 없는 루틴이 잘 어울려요.');
  }

  if (highFatigueCount >= 2 || avgFatigue <= 2.5) {
    insights.push('피로도가 높은 날이 반복되고 있어요.');
  }

  if (activeExerciseCount <= 1) {
    insights.push('운동 기록 빈도가 낮은 편이에요.');
  } else if (activeExerciseCount >= Math.max(2, targetLogs.length - 1)) {
    insights.push('움직임을 꾸준히 챙기고 있는 흐름이에요.');
  }

  if (insights.length === 0 && avgMood >= 3 && avgFatigue >= 3) {
    insights.push('전반적으로 안정적인 컨디션 흐름을 유지하고 있어요.');
  }

  if (insights.length === 0) {
    insights.push('최근 기록 흐름을 차분하게 잘 쌓아가고 있어요.');
  }

  return insights.slice(0, 3);
}
