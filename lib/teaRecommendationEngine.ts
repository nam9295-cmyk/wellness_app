import { isDateWithinLastDays } from '@/lib/date';
import { TeaRecommendationContent, TeaRecommendationId, teaRecommendationContent } from '@/lib/teaRecommendationContent';
import { UserSettings, WellnessGoal, WellnessLog } from '@/types';
import {
  normalizeExerciseScore,
  normalizeFatigueScore,
  normalizeMoodScore,
  normalizeSleepScore,
  normalizeStressScore,
  normalizeWaterScore,
} from './wellnessScoring';

type TimeSlot = 'morning' | 'late_morning' | 'afternoon' | 'early_evening' | 'late_night';
type TeaContextTag =
  | 'low_stimulation'
  | 'gentle_balance'
  | 'focus_ready'
  | 'mood_reset'
  | 'refresh_hydration'
  | 'light_refresh'
  | 'after_activity'
  | 'steady_flow'
  | 'clean_finish'
  | 'night_friendly';

interface TeaScoreBoard {
  britishBlack: number;
  asianGold: number;
  hibiscusFruit: number;
  mintyChocolat: number;
}

export interface TeaRecommendationContext {
  timeSlot: TimeSlot;
  tags: TeaContextTag[];
  activeGoal?: WellnessGoal;
  latestLog?: WellnessLog;
}

export interface TeaRecommendationResult {
  teaId: TeaRecommendationId;
  content: TeaRecommendationContent;
  secondaryTeaId?: TeaRecommendationId;
  secondaryContent?: TeaRecommendationContent;
  reason: string;
  contextLine: string;
}

interface TeaRecommendationInput {
  logs: WellnessLog[];
  userGoal?: UserSettings['goal'];
  now?: Date;
}

const teaIds = Object.keys(teaRecommendationContent) as TeaRecommendationId[];

function createScoreBoard(): TeaScoreBoard {
  return {
    britishBlack: 0,
    asianGold: 0,
    hibiscusFruit: 0,
    mintyChocolat: 0,
  };
}

function getTimeSlot(now: Date): TimeSlot {
  const hour = now.getHours();

  if (hour >= 5 && hour <= 9) {
    return 'morning';
  }

  if (hour >= 10 && hour <= 12) {
    return 'late_morning';
  }

  if (hour >= 13 && hour <= 17) {
    return 'afternoon';
  }

  if (hour >= 18 && hour <= 20) {
    return 'early_evening';
  }

  return 'late_night';
}

function getTimeSlotLabel(timeSlot: TimeSlot): string {
  switch (timeSlot) {
    case 'morning':
      return '아침';
    case 'late_morning':
      return '늦은 오전';
    case 'afternoon':
      return '오후';
    case 'early_evening':
      return '이른 저녁';
    case 'late_night':
      return '늦은 밤';
  }
}

function addGoalTags(goal: WellnessGoal | undefined, tags: Set<TeaContextTag>) {
  if (!goal) {
    return;
  }

  switch (goal) {
    case '피로 관리':
      tags.add('gentle_balance');
      break;
    case '수면 관리':
      tags.add('low_stimulation');
      tags.add('night_friendly');
      break;
    case '식습관 관리':
      tags.add('clean_finish');
      break;
    case '운동 루틴 유지':
      tags.add('after_activity');
      break;
    case '기분 관리':
      tags.add('mood_reset');
      break;
  }
}

export function deriveTeaRecommendationContext({
  logs,
  userGoal,
  now = new Date(),
}: TeaRecommendationInput): TeaRecommendationContext {
  const tags = new Set<TeaContextTag>();
  const timeSlot = getTimeSlot(now);
  const latestLog = logs[0];

  addGoalTags(userGoal, tags);

  if (timeSlot === 'late_night') {
    tags.add('night_friendly');
  }

  if (!latestLog) {
    return {
      timeSlot,
      tags: Array.from(tags),
      activeGoal: userGoal,
    };
  }

  if (normalizeSleepScore(latestLog.sleep) <= 2) {
    tags.add('low_stimulation');
    tags.add('gentle_balance');
  }

  // 피로도는 1이 가장 피곤하고 5가 가장 활기찬 방향이다.
  if (normalizeFatigueScore(latestLog.fatigue) <= 2) {
    tags.add('gentle_balance');
  }

  if (normalizeFatigueScore(latestLog.fatigue) >= 4) {
    tags.add('focus_ready');
  }

  // 기분도 1이 가장 낮고 5가 가장 편안한 방향이다.
  if (normalizeMoodScore(latestLog.mood) <= 2 || normalizeStressScore(latestLog.stress) <= 2) {
    tags.add('mood_reset');
  }

  if (normalizeMoodScore(latestLog.mood) >= 4 && normalizeFatigueScore(latestLog.fatigue) >= 3) {
    tags.add('steady_flow');
  }

  if (normalizeWaterScore(latestLog.water) <= 2) {
    tags.add('refresh_hydration');
  }

  if (normalizeExerciseScore(latestLog.exercise) <= 2) {
    tags.add('light_refresh');
  } else {
    tags.add('after_activity');
  }

  return {
    timeSlot,
    tags: Array.from(tags),
    activeGoal: userGoal,
    latestLog,
  };
}

function applyTimeSlotScores(scoreBoard: TeaScoreBoard, timeSlot: TimeSlot) {
  switch (timeSlot) {
    case 'morning':
      scoreBoard.britishBlack += 4;
      scoreBoard.asianGold += 2;
      scoreBoard.mintyChocolat += 1;
      break;
    case 'late_morning':
      scoreBoard.britishBlack += 2;
      scoreBoard.asianGold += 3;
      scoreBoard.hibiscusFruit += 2;
      scoreBoard.mintyChocolat += 2;
      break;
    case 'afternoon':
      scoreBoard.britishBlack += 1;
      scoreBoard.asianGold += 3;
      scoreBoard.hibiscusFruit += 3;
      scoreBoard.mintyChocolat += 3;
      break;
    case 'early_evening':
      scoreBoard.britishBlack += 2;
      scoreBoard.asianGold += 3;
      scoreBoard.hibiscusFruit += 1;
      scoreBoard.mintyChocolat += 3;
      break;
    case 'late_night':
      scoreBoard.britishBlack -= 4;
      scoreBoard.asianGold += 3;
      scoreBoard.hibiscusFruit += 4;
      scoreBoard.mintyChocolat -= 3;
      break;
  }
}

function applyGoalScores(scoreBoard: TeaScoreBoard, goal: WellnessGoal | undefined) {
  switch (goal) {
    case '피로 관리':
      scoreBoard.asianGold += 3;
      scoreBoard.hibiscusFruit += 1;
      break;
    case '수면 관리':
      scoreBoard.asianGold += 2;
      scoreBoard.hibiscusFruit += 3;
      scoreBoard.britishBlack -= 1;
      scoreBoard.mintyChocolat -= 1;
      break;
    case '식습관 관리':
      scoreBoard.asianGold += 2;
      scoreBoard.hibiscusFruit += 1;
      scoreBoard.mintyChocolat += 3;
      break;
    case '운동 루틴 유지':
      scoreBoard.britishBlack += 1;
      scoreBoard.asianGold += 2;
      scoreBoard.hibiscusFruit += 1;
      scoreBoard.mintyChocolat += 1;
      break;
    case '기분 관리':
      scoreBoard.asianGold += 2;
      scoreBoard.hibiscusFruit += 3;
      scoreBoard.mintyChocolat += 1;
      break;
  }
}

function applyTagScores(scoreBoard: TeaScoreBoard, tags: TeaContextTag[]) {
  tags.forEach((tag) => {
    switch (tag) {
      case 'low_stimulation':
        scoreBoard.britishBlack -= 2;
        scoreBoard.asianGold += 3;
        scoreBoard.hibiscusFruit += 2;
        scoreBoard.mintyChocolat -= 1;
        break;
      case 'gentle_balance':
        scoreBoard.britishBlack -= 1;
        scoreBoard.asianGold += 3;
        scoreBoard.hibiscusFruit += 1;
        break;
      case 'focus_ready':
        scoreBoard.britishBlack += 3;
        scoreBoard.asianGold += 1;
        scoreBoard.mintyChocolat += 1;
        break;
      case 'mood_reset':
        scoreBoard.asianGold += 2;
        scoreBoard.hibiscusFruit += 3;
        scoreBoard.mintyChocolat += 1;
        break;
      case 'refresh_hydration':
        scoreBoard.asianGold += 2;
        scoreBoard.hibiscusFruit += 3;
        scoreBoard.mintyChocolat += 1;
        break;
      case 'light_refresh':
        scoreBoard.asianGold += 1;
        scoreBoard.hibiscusFruit += 2;
        scoreBoard.mintyChocolat += 1;
        break;
      case 'after_activity':
        scoreBoard.britishBlack += 1;
        scoreBoard.asianGold += 2;
        scoreBoard.hibiscusFruit += 1;
        break;
      case 'steady_flow':
        scoreBoard.britishBlack += 2;
        scoreBoard.asianGold += 2;
        scoreBoard.hibiscusFruit += 1;
        break;
      case 'clean_finish':
        scoreBoard.asianGold += 1;
        scoreBoard.hibiscusFruit += 1;
        scoreBoard.mintyChocolat += 3;
        break;
      case 'night_friendly':
        scoreBoard.britishBlack -= 2;
        scoreBoard.asianGold += 2;
        scoreBoard.hibiscusFruit += 3;
        scoreBoard.mintyChocolat -= 2;
        break;
    }
  });
}

function scoreTeaRecommendationContext(context: TeaRecommendationContext): TeaScoreBoard {
  const scoreBoard = createScoreBoard();

  applyTimeSlotScores(scoreBoard, context.timeSlot);
  applyGoalScores(scoreBoard, context.activeGoal);
  applyTagScores(scoreBoard, context.tags);

  return scoreBoard;
}

function getTeaReason(teaId: TeaRecommendationId, context: TeaRecommendationContext): string {
  const { tags, timeSlot } = context;

  switch (teaId) {
    case 'britishBlack':
      if (tags.includes('focus_ready')) {
        return '또렷한 흐름이 필요한 오늘, 구조감이 잘 맞아요.';
      }

      return '리듬을 또렷하게 잡아줄 한 잔으로 잘 어울려요.';
    case 'asianGold':
      if (tags.includes('low_stimulation') || tags.includes('gentle_balance')) {
        return '부드러운 리듬이 오늘과 잘 어울려요.';
      }

      if (tags.includes('steady_flow')) {
        return '지금의 좋은 흐름을 가볍게 이어가기 좋아요.';
      }

      return '균형감 있게 정돈되는 한 잔이 잘 어울려요.';
    case 'hibiscusFruit':
      if (tags.includes('refresh_hydration') || tags.includes('mood_reset')) {
        return '분위기를 가볍게 바꾸고 싶을 때 잘 맞아요.';
      }

      if (timeSlot === 'late_night') {
        return '늦은 시간에도 가볍게 즐기기 좋아요.';
      }

      return '밝고 경쾌한 무드가 필요한 순간에 어울려요.';
    case 'mintyChocolat':
      if (tags.includes('clean_finish')) {
        return '식후 전환이 필요할 때 잘 맞아요.';
      }

      if (tags.includes('mood_reset')) {
        return '상쾌함과 만족감을 함께 챙기기 좋아요.';
      }

      return '오후 리듬을 환기할 때 잘 맞아요.';
  }
}

function getSituationLabel(teaId: TeaRecommendationId, tags: TeaContextTag[]): string {
  if (tags.includes('clean_finish')) {
    return '식후 전환';
  }

  if (tags.includes('mood_reset')) {
    return '기분 환기';
  }

  if (tags.includes('focus_ready')) {
    return '집중 루틴';
  }

  if (tags.includes('refresh_hydration') || tags.includes('light_refresh')) {
    return '가벼운 리셋';
  }

  if (tags.includes('gentle_balance') || tags.includes('low_stimulation')) {
    return '부드러운 데일리 루틴';
  }

  return teaRecommendationContent[teaId].situations[0];
}

function getRankedTeaIds(scoreBoard: TeaScoreBoard): TeaRecommendationId[] {
  return [...teaIds].sort((a, b) => {
    if (scoreBoard[b] !== scoreBoard[a]) {
      return scoreBoard[b] - scoreBoard[a];
    }

    return a.localeCompare(b);
  });
}

export function getTeaRecommendation(input: TeaRecommendationInput): TeaRecommendationResult {
  const context = deriveTeaRecommendationContext(input);
  const scoreBoard = scoreTeaRecommendationContext(context);

  const rankedTeaIds = getRankedTeaIds(scoreBoard);
  const topTeaId = rankedTeaIds[0];
  const secondaryTeaId = rankedTeaIds[1];
  const content = teaRecommendationContent[topTeaId];
  const situationLabel = getSituationLabel(topTeaId, context.tags);

  return {
    teaId: topTeaId,
    content,
    secondaryTeaId,
    secondaryContent: secondaryTeaId ? teaRecommendationContent[secondaryTeaId] : undefined,
    reason: getTeaReason(topTeaId, context),
    contextLine: `오늘의 흐름: ${getTimeSlotLabel(context.timeSlot)} · ${situationLabel}`,
  };
}

function getRecentFlowLogs(logs: WellnessLog[]): WellnessLog[] {
  const recent7DaysLogs = logs.filter((log) => isDateWithinLastDays(log.date, 7));
  return recent7DaysLogs.length > 0 ? recent7DaysLogs : logs.slice(0, 7);
}

function deriveRecentFlowTeaContext({
  logs,
  userGoal,
}: TeaRecommendationInput): TeaRecommendationContext {
  const targetLogs = getRecentFlowLogs(logs);
  const tags = new Set<TeaContextTag>();

  addGoalTags(userGoal, tags);

  if (targetLogs.length === 0) {
    return {
      timeSlot: 'afternoon',
      tags: Array.from(tags),
      activeGoal: userGoal,
    };
  }

  const lowSleepCount = targetLogs.filter((log) => normalizeSleepScore(log.sleep) <= 2).length;
  const lowMoodCount = targetLogs.filter((log) => normalizeMoodScore(log.mood) <= 2).length;
  const lowStressCount = targetLogs.filter((log) => normalizeStressScore(log.stress) <= 2).length;
  const lowWaterCount = targetLogs.filter((log) => normalizeWaterScore(log.water) <= 2).length;
  const activeDays = targetLogs.filter((log) => normalizeExerciseScore(log.exercise) >= 3).length;
  const avgMood =
    targetLogs.reduce((sum, log) => sum + normalizeMoodScore(log.mood), 0) / targetLogs.length;
  const avgFatigue =
    targetLogs.reduce((sum, log) => sum + normalizeFatigueScore(log.fatigue), 0) / targetLogs.length;

  if (lowSleepCount >= 2) {
    tags.add('low_stimulation');
    tags.add('gentle_balance');
  }

  if (avgFatigue <= 2.5) {
    tags.add('gentle_balance');
  }

  if (avgFatigue >= 3.8 && activeDays >= 2) {
    tags.add('focus_ready');
  }

  if (lowMoodCount >= 2 || lowStressCount >= 2 || avgMood <= 2.7) {
    tags.add('mood_reset');
  }

  if (avgMood >= 3.5 && avgFatigue >= 3 && lowSleepCount === 0) {
    tags.add('steady_flow');
  }

  if (lowWaterCount >= 2) {
    tags.add('refresh_hydration');
  }

  if (activeDays <= 1) {
    tags.add('light_refresh');
  } else if (activeDays >= 3) {
    tags.add('after_activity');
  }

  return {
    timeSlot: 'afternoon',
    tags: Array.from(tags),
    activeGoal: userGoal,
    latestLog: targetLogs[0],
  };
}

function getRecentFlowReason(logs: WellnessLog[], teaId: TeaRecommendationId): string {
  const targetLogs = getRecentFlowLogs(logs);

  if (targetLogs.length === 0) {
    return '기록이 쌍이면 추천이 더 또렷해져요.';
  }

  const lowSleepCount = targetLogs.filter((log) => normalizeSleepScore(log.sleep) <= 2).length;
  const lowMoodCount = targetLogs.filter((log) => normalizeMoodScore(log.mood) <= 2).length;
  const lowStressCount = targetLogs.filter((log) => normalizeStressScore(log.stress) <= 2).length;
  const lowWaterCount = targetLogs.filter((log) => normalizeWaterScore(log.water) <= 2).length;
  const activeDays = targetLogs.filter((log) => normalizeExerciseScore(log.exercise) >= 3).length;
  const avgMood =
    targetLogs.reduce((sum, log) => sum + normalizeMoodScore(log.mood), 0) / targetLogs.length;
  const avgFatigue =
    targetLogs.reduce((sum, log) => sum + normalizeFatigueScore(log.fatigue), 0) / targetLogs.length;

  if (lowSleepCount >= 2) {
    return teaId === 'asianGold' || teaId === 'hibiscusFruit'
      ? '부드럽고 자극이 적은 흐름이 잘 어울려요.'
      : '수면 흐름을 고려해 자극이 적은 쪽으로 골랐어요.';
  }

  if (lowWaterCount >= 2) {
    return '리듬을 산뜻하게 환기해줄 블렌드예요.';
  }

  if (lowMoodCount >= 2 || lowStressCount >= 2 || avgMood <= 2.7) {
    return '분위기를 가볝게 바꿔줄 무드가 잘 맞아요.';
  }

  if (activeDays <= 1) {
    return '무겁지 않게 리듬을 다시 붙이기 좋아요.';
  }

  if (avgMood >= 3.5 && avgFatigue >= 3) {
    return '안정적인 흐름을 이어가기 좋아요.';
  }

  return '균형감 있는 블렌드가 잘 맞는 흐름이에요.';
}

function getRecentFlowContextLine(teaId: TeaRecommendationId, logs: WellnessLog[]): string {
  const targetLogs = getRecentFlowLogs(logs);

  if (targetLogs.length === 0) {
    return `최근 흐름: ${teaRecommendationContent[teaId].situations[0]}`;
  }

  const activeDays = targetLogs.filter((log) => log.exercise !== '안 함').length;
  const lowSleepCount = targetLogs.filter((log) => log.sleep === '매우 부족' || log.sleep === '부족').length;
  const lowWaterCount = targetLogs.filter((log) => log.water === '부족').length;

  if (lowSleepCount >= 2) {
    return '최근 흐름: 부드러운 데일리 루틴';
  }

  if (lowWaterCount >= 2) {
    return '최근 흐름: 가벼운 리셋';
  }

  if (activeDays <= 1) {
    return '최근 흐름: 기분 환기 · 가벼운 전환';
  }

  if (activeDays >= 3) {
    return '최근 흐름: 꾸준한 루틴 이어가기';
  }

  return `최근 흐름: ${teaRecommendationContent[teaId].situations[0]}`;
}

export function getTeaRecommendationForRecentFlow(input: TeaRecommendationInput): TeaRecommendationResult {
  const context = deriveRecentFlowTeaContext(input);
  const scoreBoard = scoreTeaRecommendationContext(context);
  const rankedTeaIds = getRankedTeaIds(scoreBoard);
  const topTeaId = rankedTeaIds[0];
  const secondaryTeaId = rankedTeaIds[1];

  return {
    teaId: topTeaId,
    content: teaRecommendationContent[topTeaId],
    secondaryTeaId,
    secondaryContent: secondaryTeaId ? teaRecommendationContent[secondaryTeaId] : undefined,
    reason: getRecentFlowReason(input.logs, topTeaId),
    contextLine: getRecentFlowContextLine(topTeaId, input.logs),
  };
}
