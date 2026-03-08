import { UserSettings, WellnessLog } from '@/types';

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
      title: '오늘의 추천',
      message: userSettings?.goal
        ? `${userSettings.goal}에 맞춰 오늘 컨디션을 남겨보세요.`
        : '오늘 컨디션을 남기며 흐름을 쌍아보세요.',
    };
  }

  const avgMood = recentLogs.reduce((sum, log) => sum + log.mood, 0) / recentLogs.length;
  const activeDays = recentLogs.filter((log) => log.exercise !== '안 함').length;

  if ((latestLog.sleep === '매우 부족' || latestLog.sleep === '부족') && latestLog.fatigue <= 2) {
    return {
      title: '오늘의 추천',
      message: '오늘은 회복 위주로 리듬을 가져가보세요.',
    };
  }

  if (latestLog.water === '부족') {
    return {
      title: '오늘의 추천',
      message: '수분을 조금 더 챙겨보세요.',
    };
  }

  if (activeDays === 0) {
    return {
      title: '오늘의 추천',
      message: '가벼운 산책이나 스트레칭부터 시작해보세요.',
    };
  }

  if (avgMood <= 2.5 || latestLog.mood <= 2) {
    return {
      title: '오늘의 추천',
      message: '무리하지 말고 천천히 컨디션을 살펴보세요.',
    };
  }

  return {
    title: '오늘의 추천',
    message: '지금의 좋은 흐름을 차분하게 이어가보세요.',
  };
}
