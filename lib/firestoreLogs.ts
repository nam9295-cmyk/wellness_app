import { collection, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { SUBCOLLECTIONS, COLLECTIONS } from '@/lib/firebaseCollections';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { createMemberIdentityPayload, mergeMemberProfile } from '@/lib/firestoreMember';
import { getOrCreateMemberId } from '@/lib/memberIdentity';
import {
  MemberProfile,
  UserSettings,
  WellnessLog,
} from '@/types';
import { sortLogsByDateDesc } from './logUtils';
import { normalizeLogsForReport } from './reportLogUtils';
import {
  getScoreLabel,
  normalizeExerciseScore,
  normalizeFatigueScore,
  normalizeMealScore,
  normalizeMoodScore,
  normalizeSleepScore,
  normalizeStressScore,
  normalizeWaterScore,
} from './wellnessScoring';

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
  if (
    normalizeMoodScore(log.mood) <= 2 ||
    normalizeFatigueScore(log.fatigue) <= 2 ||
    normalizeSleepScore(log.sleep) <= 1
  ) {
    return 'Check';
  }

  if (normalizeSleepScore(log.sleep) <= 2 || normalizeWaterScore(log.water) <= 2) {
    return 'Attention';
  }

  return 'Stable';
}

function getAdminSummary(log: WellnessLog) {
  const sleepLabel = getScoreLabel('sleep', normalizeSleepScore(log.sleep), '보통');
  return `수면 ${sleepLabel}, 기분 ${normalizeMoodScore(log.mood)}/5, 피로 ${normalizeFatigueScore(log.fatigue)}/5 기준으로 오늘 기록이 저장되었습니다.`;
}

function getParentSummary(log: WellnessLog) {
  const sleepLabel = getScoreLabel('sleep', normalizeSleepScore(log.sleep), '보통');
  return `오늘 컨디션 기록이 업데이트되었어요. 수면은 ${sleepLabel}, 기분은 ${normalizeMoodScore(log.mood)}/5 흐름이에요.`;
}

function getFocusLabel(log: WellnessLog, settings: UserSettings | null) {
  if (normalizeWaterScore(log.water) <= 2) {
    return '수분 섭취 흐름 확인';
  }

  if (normalizeSleepScore(log.sleep) <= 2) {
    return '휴식 루틴 확인';
  }

  if (settings?.goal) {
    return `${settings.goal} 흐름 확인`;
  }

  return '오늘 컨디션 체크';
}

function toWellnessLog(data: Record<string, unknown>, fallbackId: string): WellnessLog | null {
  const date = typeof data.date === 'string' ? data.date : null;

  if (!date) {
    return null;
  }

  return {
    id: typeof data.id === 'string' ? data.id : fallbackId,
    date,
    sleep: getScoreLabel('sleep', normalizeSleepScore(data.sleep), '보통') as WellnessLog['sleep'],
    fatigue: normalizeFatigueScore(data.fatigue),
    mood: normalizeMoodScore(data.mood),
    stress: normalizeStressScore(data.stress),
    meal: getScoreLabel('meal', normalizeMealScore(data.meal), '보통') as WellnessLog['meal'],
    exercise: getScoreLabel('exercise', normalizeExerciseScore(data.exercise), '안 함') as WellnessLog['exercise'],
    water: getScoreLabel('water', normalizeWaterScore(data.water), '보통') as WellnessLog['water'],
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
      mood: normalizeMoodScore(log.mood),
      sleep: normalizeSleepScore(log.sleep),
      fatigue: normalizeFatigueScore(log.fatigue),
      stress: normalizeStressScore(log.stress),
      focus: getFocusLabel(log, settings),
      updatedAt: nowLabel,
      memo: log.memo || '',
      meal: normalizeMealScore(log.meal),
      exercise: normalizeExerciseScore(log.exercise),
      water: normalizeWaterScore(log.water),
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
