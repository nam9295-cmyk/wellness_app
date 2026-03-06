export const SLEEP_STATES = ['매우 부족', '부족', '보통', '좋음', '매우 좋음'] as const;
export const MEAL_STATES = ['불규칙', '보통', '균형적'] as const;
export const EXERCISE_STATES = ['안 함', '가볍게', '충분히'] as const;
export const WATER_STATES = ['부족', '보통', '충분'] as const;
export const WELLNESS_GOALS = ['피로 관리', '수면 관리', '식습관 관리', '운동 루틴 유지', '기분 관리'] as const;

export type SleepState = typeof SLEEP_STATES[number];
export type MealState = typeof MEAL_STATES[number];
export type ExerciseState = typeof EXERCISE_STATES[number];
export type WaterState = typeof WATER_STATES[number];
export type WellnessGoal = typeof WELLNESS_GOALS[number];

export interface WellnessLog {
  id: string;
  date: string;
  sleep: SleepState;
  fatigue: number; // 1-5
  mood: number; // 1-5
  meal: MealState;
  exercise: ExerciseState;
  water: WaterState;
  memo: string;
}

export type WellnessLogInput = Omit<WellnessLog, 'id'>;

export interface UserSettings {
  nickname: string;
  goal: WellnessGoal;
  notificationTime: string; // e.g., "09:00" or empty
  notificationEnabled: boolean;
  useMenstrualCycle: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  nickname: '',
  goal: '피로 관리',
  notificationTime: '09:00',
  notificationEnabled: false,
  useMenstrualCycle: false,
};
