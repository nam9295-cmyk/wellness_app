import { UserSettings, WellnessLog } from '@/types';
import {
  normalizeExerciseScore,
  normalizeFatigueScore,
  normalizeMoodScore,
  normalizeSleepScore,
  normalizeStressScore,
  normalizeWaterScore,
} from './wellnessScoring';

export interface HomeRecommendation {
  title: string;
  message: string;
}

function getRecentLogs(logs: WellnessLog[], limit = 3): WellnessLog[] {
  return logs.slice(0, limit);
}

export function getHomeRecommendation(logs: WellnessLog[], userSettings: UserSettings | null): HomeRecommendation {
  const recentLogs = getRecentLogs(logs);
  const latestLog = recentLogs[0];

  if (!latestLog) {
    return {
      title: '웰니스 분석 리포트',
      message: userSettings?.goal
        ? `안녕하세요! 설정하신 [${userSettings.goal}] 목표에 맞춰 맞춤형 분석을 제공해 드릴게요. 먼저 오늘의 컨디션을 기록해 주시면, 현재 상태를 진단하고 가장 필요한 액션을 제안해 드립니다.`
        : '안녕하세요! 매일의 컨디션을 기록하시면, 나만의 웰니스 흐름을 읽어내어 맞춤형 힐링 리포트와 티 추천을 제공해 드립니다. 지금 바로 첫 기록을 남겨보세요.',
    };
  }

  const sleep = normalizeSleepScore(latestLog.sleep);
  const fatigue = normalizeFatigueScore(latestLog.fatigue);
  const water = normalizeWaterScore(latestLog.water);
  const exercise = normalizeExerciseScore(latestLog.exercise);
  const mood = normalizeMoodScore(latestLog.mood);
  const stress = normalizeStressScore(latestLog.stress);

  let story = '';

  if (sleep <= 2 && fatigue <= 2) {
    story = `오늘 수면 점수가 ${sleep}점으로 다소 부족하고 피로감이 높으시군요. 수면이 충분하지 않으면 몸이 무겁고 에너지가 떨어지기 쉽습니다. 오늘은 무리한 활동보다는 따뜻한 차 한 잔과 함께 일찍 잠자리에 들어 몸을 회복하는 데 집중해 보세요.`;
  } else if (stress <= 2 && mood <= 2) {
    story = `현재 스트레스 지수가 높고 기분이 가라앉아 있는 것 같아요. 복잡한 생각은 잠시 내려놓고, 깊은 심호흡이나 명상으로 마음의 긴장을 풀어주는 시간을 가져보세요. 몸과 마음을 차분하게 달래주는 허브티가 도움이 될 수 있습니다.`;
  } else if (water <= 2 && fatigue <= 3) {
    story = `수분 섭취가 ${water}점으로 다소 부족하네요. 체내 수분이 부족하면 쉽게 피로해지고 집중력이 떨어질 수 있습니다. 평소보다 따뜻한 물이나 카페인이 없는 차를 1~2잔 더 마시며 수분을 충분히 보충해 주세요.`;
  } else if (exercise <= 2) {
    story = `신체 활동량이 적은 하루였습니다. 가벼운 스트레칭이나 10분 정도의 산책만으로도 굳어 있던 근육이 풀리고 기분 전환에 큰 도움이 됩니다. 일상에 작은 움직임을 더해보세요.`;
  } else if (sleep >= 4 && mood >= 4) {
    story = `수면과 기분 모두 훌륭한 상태를 유지하고 계시네요! 몸과 마음의 밸런스가 아주 좋습니다. 이 좋은 에너지를 바탕으로 오늘 계획하신 일들을 여유롭고 활기차게 해내시길 응원합니다.`;
  } else {
    story = `전반적으로 무난한 컨디션을 유지하고 계십니다. ${userSettings?.goal ? `[${userSettings.goal}] 목표를 향해 잘 나아가고 있어요.` : '지금처럼 나만의 페이스를 유지하며 하루를 보내세요.'} 작은 틈을 내어 따뜻한 차와 함께 온전한 휴식을 즐기는 것도 잊지 마세요.`;
  }

  return {
    title: '✨ 오늘의 웰니스 리포트',
    message: story,
  };
}
