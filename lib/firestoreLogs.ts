import { collection, doc, setDoc } from 'firebase/firestore';
import { SUBCOLLECTIONS, COLLECTIONS } from '@/lib/firebaseCollections';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { getOrCreateMemberId } from '@/lib/memberIdentity';
import { UserSettings, WellnessLog } from '@/types';

type MemberStatus = 'Stable' | 'Attention' | 'Check';

interface SyncTodayLogToFirestoreInput {
  log: WellnessLog;
  settings: UserSettings | null;
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

export async function syncTodayLogToFirestore({
  log,
  settings,
}: SyncTodayLogToFirestoreInput): Promise<{ synced: boolean; memberId?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: false };
  }

  const memberId = await getOrCreateMemberId();
  const status = getMemberStatus(log);
  const now = new Date();
  const nowLabel = toTimestampString(now);
  const facilityId = process.env.EXPO_PUBLIC_FIREBASE_FACILITY_ID?.trim() || 'wellness-app';
  const memberName = settings?.nickname?.trim() || '앱 사용자';

  await setDoc(
    doc(db, COLLECTIONS.members, memberId),
    {
      name: memberName,
      age: 0,
      room: '',
      group: '웰니스 앱',
      facilityId,
      status,
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
