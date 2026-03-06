import { UserSettings } from '@/types';

export type NotificationScenarioId =
  | 'dailyLogReminder'
  | 'dailyTeaRecommendation'
  | 'weeklyReportReminder';

export interface NotificationScenarioDefinition {
  id: NotificationScenarioId;
  title: string;
  description: string;
  cadence: 'daily' | 'contextual' | 'weekly';
}

export interface NotificationScenarioPreview extends NotificationScenarioDefinition {
  enabled: boolean;
  statusLabel: string;
  scheduleLabel: string;
}

export const notificationScenarios: NotificationScenarioDefinition[] = [
  {
    id: 'dailyLogReminder',
    title: '오늘 기록 알림',
    description: '하루 컨디션을 가볍게 남길 수 있도록 정해둔 시간에 알려주는 흐름이에요.',
    cadence: 'daily',
  },
  {
    id: 'dailyTeaRecommendation',
    title: '오늘의 추천 티 확인',
    description: '기록 후 홈 추천으로 자연스럽게 이어질 수 있도록 준비한 흐름이에요.',
    cadence: 'contextual',
  },
  {
    id: 'weeklyReportReminder',
    title: '이번 주 리포트 확인',
    description: '최근 기록과 티 추천 흐름을 주간 기준으로 돌아볼 수 있도록 준비한 흐름이에요.',
    cadence: 'weekly',
  },
];

function getDailyScheduleLabel(time: string) {
  return time ? `매일 ${time}` : '시간 미설정';
}

function getWeeklyScheduleLabel(time: string) {
  return time ? `매주 일요일 ${time}` : '시간 미설정';
}

export function getNotificationScenarioPreviews(
  settings: Pick<UserSettings, 'notificationEnabled' | 'notificationTime'> | null
): NotificationScenarioPreview[] {
  const enabled = Boolean(settings?.notificationEnabled);
  const time = settings?.notificationTime ?? '';

  return notificationScenarios.map((scenario) => ({
    ...scenario,
    enabled,
    statusLabel: enabled ? '준비됨' : '준비 중',
    scheduleLabel:
      scenario.id === 'weeklyReportReminder'
        ? getWeeklyScheduleLabel(time)
        : scenario.id === 'dailyTeaRecommendation'
          ? '오늘 기록 이후 홈 추천과 연결'
          : getDailyScheduleLabel(time),
  }));
}
