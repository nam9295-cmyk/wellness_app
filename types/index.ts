export type SleepState = '매우 부족' | '부족' | '보통' | '좋음' | '매우 좋음';
export type MealState = '불규칙' | '보통' | '균형적';
export type ExerciseState = '안 함' | '가볍게' | '충분히';
export type WaterState = '부족' | '보통' | '충분';

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

export interface UserSettings {
  nickname: string;
  goal: string;
  notificationTime: string; // e.g., "09:00" or empty
  useMenstrualCycle: boolean;
}
