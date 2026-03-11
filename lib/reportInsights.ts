import { WellnessLog } from '@/types';
import { getRecentLogsForReport } from './reportLogUtils';
import {
  calculateMentalRhythmScore,
  calculatePhysicalRhythmScore,
  normalizeExerciseScore,
  normalizeFatigueScore,
  normalizeMoodScore,
  normalizeSleepScore,
} from './wellnessScoring';

function buildInsights(targetLogs: WellnessLog[]): string[] {
  if (targetLogs.length === 0) {
    return ['아직 기록이 적어요. 오늘 컨디션부터 남겨보세요.'];
  }

  const insights: string[] = [];

  const lowSleepCount = targetLogs.filter((log) => normalizeSleepScore(log.sleep) <= 2).length;
  const lowMoodCount = targetLogs.filter((log) => normalizeMoodScore(log.mood) <= 2).length;
  const highFatigueCount = targetLogs.filter((log) => normalizeFatigueScore(log.fatigue) <= 2).length;
  const activeExerciseCount = targetLogs.filter((log) => normalizeExerciseScore(log.exercise) >= 3).length;
  const avgMood =
    targetLogs.reduce((sum, log) => sum + normalizeMoodScore(log.mood), 0) / targetLogs.length;
  const avgFatigue =
    targetLogs.reduce((sum, log) => sum + normalizeFatigueScore(log.fatigue), 0) / targetLogs.length;
  const avgPhysical =
    targetLogs.reduce((sum, log) => sum + calculatePhysicalRhythmScore(log), 0) / targetLogs.length;
  const avgMental =
    targetLogs.reduce((sum, log) => sum + calculateMentalRhythmScore(log), 0) / targetLogs.length;

  if (lowSleepCount >= 2) {
    insights.push('수면이 부족한 날이 자주 보여요.');
  }

  if (avgMood >= 3.5 && lowMoodCount === 0) {
    insights.push('기분이 안정적인 흐름이에요.');
  } else if (lowMoodCount >= 2) {
    insights.push('기분이 가라앉는 날이 이어지고 있어요.');
  }

  if (highFatigueCount >= 2 || avgFatigue <= 2.5) {
    insights.push('피로감이 높은 날이 반복되고 있어요.');
  }

  if (activeExerciseCount <= 1) {
    insights.push('움직임이 적은 편이에요.');
  } else if (activeExerciseCount >= Math.max(2, targetLogs.length - 1)) {
    insights.push('움직임을 꾸준히 챙기고 있어요.');
  }

  if (avgPhysical >= 3.8 && avgMental >= 3.8) {
    insights.push('신체와 마음 흐름이 비교적 안정적이에요.');
  } else if (avgPhysical <= 2.6) {
    insights.push('신체 리듬을 조금 더 가볍게 돌보면 좋아요.');
  } else if (avgMental <= 2.6) {
    insights.push('정신 리듬을 천천히 정리해보면 좋아요.');
  }

  if (insights.length === 0 && avgMood >= 3 && avgFatigue >= 3) {
    insights.push('안정적인 컨디션을 유지하고 있어요.');
  }

  if (insights.length === 0) {
    insights.push('기록을 잘 쌓아가고 있어요.');
  }

  return insights.slice(0, 3);
}

export function generateReportInsights(logs: WellnessLog[]): string[] {
  return buildInsights(getRecentLogsForReport(logs));
}

export function generateOverallReportInsights(logs: WellnessLog[]): string[] {
  return buildInsights(logs);
}
