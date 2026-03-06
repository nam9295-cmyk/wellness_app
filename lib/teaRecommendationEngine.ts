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
  const scoreBoard = createScoreBoard();

  applyTimeSlotScores(scoreBoard, context.timeSlot);
  applyGoalScores(scoreBoard, context.activeGoal);
  applyTagScores(scoreBoard, context.tags);

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
