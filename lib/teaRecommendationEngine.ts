import { isDateWithinLastDays } from '@/lib/date';
import { TeaRecommendationContent, TeaRecommendationId, teaRecommendationContent } from '@/lib/teaRecommendationContent';
import { UserSettings, WellnessGoal, WellnessLog } from '@/types';

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

  if (latestLog.sleep === '매우 부족' || latestLog.sleep === '부족') {
    tags.add('low_stimulation');
    tags.add('gentle_balance');
  }

  // 피로도는 1이 가장 피곤하고 5가 가장 활기찬 방향이다.
  if (latestLog.fatigue <= 2) {
    tags.add('gentle_balance');
  }

  if (latestLog.fatigue >= 4) {
    tags.add('focus_ready');
  }

  // 기분도 1이 가장 낮고 5가 가장 편안한 방향이다.
  if (latestLog.mood <= 2) {
    tags.add('mood_reset');
  }

  if (latestLog.mood >= 4 && latestLog.fatigue >= 3) {
    tags.add('steady_flow');
  }

  if (latestLog.water === '부족') {
    tags.add('refresh_hydration');
  }

  if (latestLog.exercise === '안 함') {
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
        return '아침이나 집중이 필요한 시간대에 단정한 구조감이 잘 어울려요.';
      }

      return '또렷한 중심이 필요한 루틴에 잘 맞는 쪽으로 골랐어요.';
    case 'asianGold':
      if (tags.includes('low_stimulation') || tags.includes('gentle_balance')) {
        return '오늘은 과하지 않고 부드럽게 이어지는 티가 잘 맞아요.';
      }

      if (tags.includes('steady_flow')) {
        return '좋은 흐름을 무겁지 않게 이어가고 싶을 때 잘 어울려요.';
      }

      return '균형감 있게 정돈되는 한 잔이 오늘 리듬과 잘 맞아요.';
    case 'hibiscusFruit':
      if (tags.includes('refresh_hydration') || tags.includes('mood_reset')) {
        return '산뜻하게 분위기를 전환하고 싶은 흐름에 잘 맞아요.';
      }

      if (timeSlot === 'late_night') {
        return '늦은 시간에도 비교적 가볍게 즐기기 좋은 쪽으로 골랐어요.';
      }

      return '밝고 경쾌한 무드가 필요한 순간에 잘 어울려요.';
    case 'mintyChocolat':
      if (tags.includes('clean_finish')) {
        return '식후에 깔끔하게 전환하고 싶을 때 잘 맞아요.';
      }

      if (tags.includes('mood_reset')) {
        return '상쾌함과 만족감을 함께 찾고 싶은 날에 어울려요.';
      }

      return '오후에 기분을 환기하고 싶을 때 잘 맞는 쪽이에요.';
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
    contextLine: `잘 맞는 흐름: ${getTimeSlotLabel(context.timeSlot)} · ${situationLabel}`,
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

  const lowSleepCount = targetLogs.filter((log) => log.sleep === '매우 부족' || log.sleep === '부족').length;
  const lowMoodCount = targetLogs.filter((log) => log.mood <= 2).length;
  const lowWaterCount = targetLogs.filter((log) => log.water === '부족').length;
  const activeDays = targetLogs.filter((log) => log.exercise !== '안 함').length;
  const avgMood = targetLogs.reduce((sum, log) => sum + log.mood, 0) / targetLogs.length;
  const avgFatigue = targetLogs.reduce((sum, log) => sum + log.fatigue, 0) / targetLogs.length;

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

  if (lowMoodCount >= 2 || avgMood <= 2.7) {
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
    return '기록이 쌓이면 최근 흐름에 맞는 티를 더 정교하게 보여드릴게요.';
  }

  const lowSleepCount = targetLogs.filter((log) => log.sleep === '매우 부족' || log.sleep === '부족').length;
  const lowMoodCount = targetLogs.filter((log) => log.mood <= 2).length;
  const lowWaterCount = targetLogs.filter((log) => log.water === '부족').length;
  const activeDays = targetLogs.filter((log) => log.exercise !== '안 함').length;
  const avgMood = targetLogs.reduce((sum, log) => sum + log.mood, 0) / targetLogs.length;
  const avgFatigue = targetLogs.reduce((sum, log) => sum + log.fatigue, 0) / targetLogs.length;

  if (lowSleepCount >= 2) {
    return teaId === 'asianGold' || teaId === 'hibiscusFruit'
      ? '최근 기록에서 수면이 가벼운 날이 이어져 보여요. 과하지 않고 부드럽게 이어지는 티가 최근 흐름과 잘 맞아요.'
      : '최근 수면 흐름을 고려해 자극이 강하지 않은 쪽으로 균형을 맞췄어요.';
  }

  if (lowWaterCount >= 2) {
    return '수분이 부족한 날이 반복돼서, 산뜻하게 전환되는 블렌드를 중심으로 골랐어요.';
  }

  if (lowMoodCount >= 2 || avgMood <= 2.7) {
    return '기분이 가라앉는 날이 보여서, 최근 흐름을 가볍게 환기해줄 수 있는 무드의 티를 골랐어요.';
  }

  if (activeDays <= 1) {
    return '운동 기록이 적은 주간에는 무겁지 않게 리듬을 다시 붙이기 좋은 티가 잘 맞아요.';
  }

  if (avgMood >= 3.5 && avgFatigue >= 3) {
    return '전반적으로 안정적인 흐름이 보여서, 지금 리듬을 자연스럽게 이어갈 수 있는 티를 골랐어요.';
  }

  return '최근 기록 전반을 보면 한쪽으로 치우치기보다 균형감 있게 이어지는 티가 잘 맞는 흐름이에요.';
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
