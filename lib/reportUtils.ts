import { WellnessLog, SleepState, ExerciseState } from '@/types';

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
      insights: ['아직 기록이 충분하지 않아요. 오늘의 웰니스를 기록해 볼까요?']
    };
  }

  // 1. 점수 평균 계산
  const avgMood = (logs.reduce((acc, log) => acc + log.mood, 0) / totalLogs).toFixed(1);
  const avgFatigue = (logs.reduce((acc, log) => acc + log.fatigue, 0) / totalLogs).toFixed(1);

  // 2. 최근 7일 기록 여부 계산
  const now = new Date();
  const recent7DaysLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const diffTime = Math.abs(now.getTime() - logDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  // 3. 가장 자주 선택된 수면 상태
  const sleepCount: Record<string, number> = {};
  logs.forEach(log => {
    sleepCount[log.sleep] = (sleepCount[log.sleep] || 0) + 1;
  });
  let maxSleepCount = 0;
  let frequentSleep = '-';
  for (const [sleep, count] of Object.entries(sleepCount)) {
    if (count > maxSleepCount) {
      maxSleepCount = count;
      frequentSleep = sleep;
    }
  }

  // 4. 운동 횟수 파악
  const exerciseCount = logs.filter(l => l.exercise === '가볍게' || l.exercise === '충분히').length;
  const exerciseRate = Math.round((exerciseCount / totalLogs) * 100);

  // 5. 인사이트 문구 생성 로직
  const insights: string[] = [];

  const moodScore = parseFloat(avgMood);
  if (moodScore >= 4.0) {
    insights.push('기분 점수가 전반적으로 높고 안정적이에요. 긍정적인 에너지가 가득하네요! ✨');
  } else if (moodScore <= 2.5) {
    insights.push('최근 기분이 조금 다운되어 있는 것 같아요. 스스로를 위한 휴식 시간이 필요할지 몰라요. ☕️');
  } else {
    insights.push('무난하고 안정적인 기분 상태를 유지하고 계시네요. 😌');
  }

  if (frequentSleep === '매우 부족' || frequentSleep === '부족') {
    insights.push('최근 수면 부족 기록이 자주 보여요. 오늘은 조금 일찍 잠자리에 들어보는 건 어떨까요? 🛌');
  }

  if (exerciseRate < 30) {
    insights.push('규칙적인 운동 빈도가 약간 낮아요. 가벼운 스트레칭이라도 시작해보는 걸 추천해요! 🚶‍♀️');
  } else if (exerciseRate >= 70) {
    insights.push('꾸준히 운동을 실천하고 계시군요! 건강한 습관이 잘 자리 잡았어요. 💪');
  }

  return {
    totalLogs,
    recent7DaysLogs,
    avgMood,
    avgFatigue,
    frequentSleep,
    insights
  };
}
