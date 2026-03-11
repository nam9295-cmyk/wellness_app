import { collection, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { SUBCOLLECTIONS, COLLECTIONS } from '@/lib/firebaseCollections';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { createMemberIdentityPayload, mergeMemberProfile } from '@/lib/firestoreMember';
import { getOrCreateMemberId } from '@/lib/memberIdentity';
import {
  EXERCISE_STATES,
  MEAL_STATES,
  MemberProfile,
  SLEEP_STATES,
  UserSettings,
  WATER_STATES,
  WellnessLog,
} from '@/types';
import { sortLogsByDateDesc } from './logUtils';
import { normalizeLogsForReport } from './reportLogUtils';

type MemberStatus = 'Stable' | 'Attention' | 'Check';

interface SyncTodayLogToFirestoreInput {
  log: WellnessLog;
  settings: UserSettings | null;
  memberProfile?: MemberProfile | null;
}

function toTimestampString(date: Date) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function getMemberStatus(log: WellnessLog): MemberStatus {
  if (log.mood <= 2 || log.fatigue <= 2 || log.sleep === '매우 부족') {
    return 'Check';
  }

  if (log.sleep === '부족' || log.water === '부족') {
    return 'Attention';
  }

  return 'Stable';
}

function getAdminSummary(log: WellnessLog) {
  return `수면 ${log.sleep}, 기분 ${log.mood}/5, 피로 ${log.fatigue}/5 기준으로 오늘 기록이 저장되었습니다.`;
}

function getParentSummary(log: WellnessLog) {
  return `오늘 컨디션 기록이 업데이트되었어요. 수면은 ${log.sleep}, 기분은 ${log.mood}/5 흐름이에요.`;
}

function getFocusLabel(log: WellnessLog, settings: UserSettings | null) {
  if (log.water === '부족') {
    return '수분 섭취 흐름 확인';
  }

  if (log.sleep === '부족' || log.sleep === '매우 부족') {
    return '휴식 루틴 확인';
  }

  if (settings?.goal) {
    return `${settings.goal} 흐름 확인`;
  }

  return '오늘 컨디션 체크';
}

function parseFivePointScore(value: unknown, fallback: number) {
  if (typeof value === 'number' && value >= 1 && value <= 5) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.split('/')[0], 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 5) {
      return parsed;
    }
  }

  return fallback;
}

function isIncludedValue<T extends string>(values: readonly T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && values.includes(value as T) ? (value as T) : fallback;
}

function toWellnessLog(data: Record<string, unknown>, fallbackId: string): WellnessLog | null {
  const date = typeof data.date === 'string' ? data.date : null;

  if (!date) {
    return null;
  }

  return {
    id: typeof data.id === 'string' ? data.id : fallbackId,
    date,
    sleep: isIncludedValue(SLEEP_STATES, data.sleep, '보통'),
    fatigue: parseFivePointScore(data.fatigue, 3),
    mood: parseFivePointScore(data.mood, 3),
    meal: isIncludedValue(MEAL_STATES, data.meal, '보통'),
    exercise: isIncludedValue(EXERCISE_STATES, data.exercise, '안 함'),
    water: isIncludedValue(WATER_STATES, data.water, '보통'),
    memo: typeof data.memo === 'string' ? data.memo : '',
  };
}

export async function syncTodayLogToFirestore({
  log,
  settings,
  memberProfile,
}: SyncTodayLogToFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const status = getMemberStatus(log);
  const now = new Date();
  const nowLabel = toTimestampString(now);
  const memberName = settings?.nickname?.trim() || '앱 사용자';
  const resolvedProfile = mergeMemberProfile({
    ...memberProfile,
    status,
  });

  await setDoc(
    doc(db, COLLECTIONS.members, memberId),
    {
      name: memberName,
      age: 0,
      room: '',
      group: '웰니스 앱',
      ...createMemberIdentityPayload(resolvedProfile, nowLabel),
      lastCheckTime: nowLabel,
      todayBlendId: '',
      todayBlendName: '',
      todayFocus: getFocusLabel(log, settings),
      note: log.memo || '',
      userId: process.env.EXPO_PUBLIC_FIREBASE_USER_ID?.trim() || '',
    },
    { merge: true }
  );

  await setDoc(
    doc(collection(db, SUBCOLLECTIONS.dailySummaries(memberId)), log.date),
    {
      date: log.date,
      status,
      adminSummary: getAdminSummary(log),
      parentSummary: getParentSummary(log),
      blendName: '',
      mood: `${log.mood}/5`,
      sleep: log.sleep,
      fatigue: `${log.fatigue}/5`,
      focus: getFocusLabel(log, settings),
      updatedAt: nowLabel,
      memo: log.memo || '',
      meal: log.meal,
      exercise: log.exercise,
      water: log.water,
    },
    { merge: true }
  );

  return {
    synced: true,
    memberId,
  };
}

export async function loadLogsFromFirestore(): Promise<WellnessLog[] | null> {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  const memberId = await getOrCreateMemberId();
  const snapshot = await getDocs(
    query(collection(db, SUBCOLLECTIONS.dailySummaries(memberId)), orderBy('date', 'desc'))
  );

  if (snapshot.empty) {
    return [];
  }

  const remoteLogs = snapshot.docs
    .map((logDoc) => toWellnessLog(logDoc.data() as Record<string, unknown>, logDoc.id))
    .filter((log): log is WellnessLog => log !== null);

  return normalizeLogsForReport(sortLogsByDateDesc(remoteLogs));
}
