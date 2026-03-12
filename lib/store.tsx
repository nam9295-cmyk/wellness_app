import React, { createContext, useContext, useState, useEffect } from 'react';
import { CWaterBlendResult } from '@/lib/cwaterBlendEngine';
import { TeaRecommendationId } from '@/lib/teaRecommendationContent';
import { CustomBlendOption } from './customBlendEngine';
import { MemberProfile, UserSettings, WellnessLog, WellnessLogInput } from '@/types';
import { isFirebaseConfigured } from './firebase';
import { getDefaultMemberProfile, loadMemberProfileFromFirestore } from './firestoreMember';
import { loadLogsFromFirestore, syncTodayLogToFirestore } from './firestoreLogs';
import { loadUserSettingsFromFirestore, syncUserSettingsToFirestore } from './firestoreSettings';
import {
  loadTeaBoxFromFirestore,
  syncSavedCWaterBlendToFirestore,
  syncRemovedBlendFromFirestore,
  syncSavedCustomBlendToFirestore,
  syncSavedTeaToFirestore,
} from './firestoreTeaBox';
import { loadLogs, saveLogs } from './storage';
import {
  createCWaterSavedBlendItem,
  createCWaterBlendItemId,
  createCustomBlendItemId,
  createCustomSavedBlendItem,
  createPresetSavedBlendItem,
  loadTeaBox,
  SavedBlendItem,
  saveTeaBox,
} from './teaBoxStorage';
import { loadMemberProfile, saveMemberProfile } from './memberProfileStorage';
import { loadUserSettings, saveUserSettings } from './userStorage';
import { createWellnessLog, findTodayLog, upsertLog } from './logUtils';
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

interface StoreContextType {
  logs: WellnessLog[];
  addLog: (log: WellnessLogInput) => Promise<void>;
  getTodayLog: () => WellnessLog | undefined;
  userSettings: UserSettings | null;
  updateSettings: (settings: UserSettings) => Promise<void>;
  latestLogFeedback: string | null;
  clearLatestLogFeedback: () => void;
  memberProfile: MemberProfile | null;
  savedBlendItems: SavedBlendItem[];
  savedTeaIds: TeaRecommendationId[];
  saveTeaToBox: (teaId: TeaRecommendationId) => Promise<{ added: boolean }>;
  saveCustomBlendToBox: (option: CustomBlendOption) => Promise<{ added: boolean; synced: boolean }>;
  saveCWaterBlendToBox: (result: CWaterBlendResult, cacaoNibLevel?: number | null, teaRatios?: Record<string, number> | null) => Promise<{ added: boolean; synced: boolean }>;
  removeSavedBlendFromBox: (itemId: string) => Promise<{ removed: boolean }>;
  removeTeaFromBox: (teaId: TeaRecommendationId) => Promise<{ removed: boolean }>;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'fallback';
  syncStatusMessage: string | null;
  clearSyncStatusMessage: () => void;
  isReady: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [latestLogFeedback, setLatestLogFeedback] = useState<string | null>(null);
  const [savedBlendItems, setSavedBlendItems] = useState<SavedBlendItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'fallback'>('idle');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const savedTeaIds = savedBlendItems
    .filter((item): item is Extract<SavedBlendItem, { type: 'preset' }> => item.type === 'preset')
    .map((item) => item.teaId);

  // 앱 로드시 저장된 데이터 불러오기
  useEffect(() => {
    let isMounted = true;
    const initializeStore = async () => {
      const storedLogs = await loadLogs();
      const storedSettings = await loadUserSettings();
      const storedTeaBox = await loadTeaBox();
      const storedMemberProfile = await loadMemberProfile();
      const initialMemberProfile = storedMemberProfile ?? getDefaultMemberProfile();

      if (!storedMemberProfile) {
        await saveMemberProfile(initialMemberProfile);
      }
      
      if (isMounted) {
        setLogs(storedLogs);
        setUserSettings(storedSettings);
        setSavedBlendItems(storedTeaBox);
        setMemberProfile(initialMemberProfile);
        setIsReady(true);
      }

      if (!isFirebaseConfigured()) {
        return;
      }

      if (isMounted) {
        setSyncStatus('syncing');
        setSyncStatusMessage('저장된 최신 내용을 확인하고 있어요.');
      }

      try {
        const [remoteLogs, remoteSettings, remoteTeaBox, remoteMemberProfile] = await Promise.all([
          loadLogsFromFirestore(),
          loadUserSettingsFromFirestore(),
          loadTeaBoxFromFirestore(),
          loadMemberProfileFromFirestore(),
        ]);

        if (!isMounted) {
          return;
        }

        if (remoteLogs) {
          setLogs(remoteLogs);
          await saveLogs(remoteLogs);
        }

        if (remoteSettings) {
          setUserSettings(remoteSettings);
          await saveUserSettings(remoteSettings);
        }

        if (remoteTeaBox) {
          setSavedBlendItems(remoteTeaBox);
          await saveTeaBox(remoteTeaBox);
        }

        if (remoteMemberProfile) {
          setMemberProfile(remoteMemberProfile);
          await saveMemberProfile(remoteMemberProfile);
        }

        if (isMounted) {
          setSyncStatus('synced');
          setSyncStatusMessage('저장된 최신 내용을 반영했어요.');
        }
      } catch (error) {
        console.warn('Failed to load synced Firestore data', error);

        if (isMounted) {
          setSyncStatus('fallback');
          setSyncStatusMessage('연결이 불안정해 로컬 데이터를 먼저 보여주고 있어요.');
        }
      }
    };
    initializeStore();
    return () => { isMounted = false; };
  }, []);

  const addLog = async (logData: WellnessLogInput) => {
    const normalizedLogData: WellnessLogInput = {
      ...logData,
      sleep: getScoreLabel('sleep', normalizeSleepScore(logData.sleep), '보통') as WellnessLogInput['sleep'],
      fatigue: normalizeFatigueScore(logData.fatigue),
      mood: normalizeMoodScore(logData.mood),
      stress: normalizeStressScore(logData.stress),
      meal: getScoreLabel('meal', normalizeMealScore(logData.meal), '보통') as WellnessLogInput['meal'],
      exercise: getScoreLabel('exercise', normalizeExerciseScore(logData.exercise), '안 함') as WellnessLogInput['exercise'],
      water: getScoreLabel('water', normalizeWaterScore(logData.water), '보통') as WellnessLogInput['water'],
    };

    const hasExistingLog = logs.some((log) => log.date === normalizedLogData.date);
    const newLog = createWellnessLog(normalizedLogData);
    const updatedLogs = upsertLog(logs, newLog);

    setLogs(updatedLogs);
    setLatestLogFeedback(
      hasExistingLog
        ? '수정 완료. 추천도 반영됐어요.'
        : '저장 완료. 추천도 업데이트됐어요.'
    );
    await saveLogs(updatedLogs);

    // Firestore 동기화는 로컬 저장 이후 best-effort 로 동작한다.
    try {
      await syncTodayLogToFirestore({
        log: newLog,
        settings: userSettings,
        memberProfile,
      });
    } catch (error) {
      console.warn('Failed to sync today log to Firestore', error);
    }
  };

  const getTodayLog = () => {
    return findTodayLog(logs);
  };

  const updateSettings = async (settings: UserSettings) => {
    setUserSettings(settings);
    await saveUserSettings(settings);

    // Firestore 동기화는 로컬 저장 이후 best-effort 로 동작한다.
    try {
      await syncUserSettingsToFirestore({ settings, memberProfile });
      if (memberProfile) {
        await saveMemberProfile(memberProfile);
      }
    } catch (error) {
      console.warn('Failed to sync user settings to Firestore', error);
    }
  };

  const clearLatestLogFeedback = () => {
    setLatestLogFeedback(null);
  };

  const clearSyncStatusMessage = () => {
    setSyncStatusMessage(null);
  };

  const saveTeaToBox = async (teaId: TeaRecommendationId) => {
    if (savedTeaIds.includes(teaId)) {
      return { added: false };
    }

    const nextItem = createPresetSavedBlendItem(teaId);
    const updatedTeaBox = [nextItem, ...savedBlendItems];
    setSavedBlendItems(updatedTeaBox);
    await saveTeaBox(updatedTeaBox);

    try {
      await syncSavedTeaToFirestore({ teaId, memberProfile });
    } catch (error) {
      console.warn('Failed to sync saved tea to Firestore', error);
    }

    return { added: true };
  };

  const saveCustomBlendToBox = async (option: CustomBlendOption) => {
    const itemId = createCustomBlendItemId(option);

    if (savedBlendItems.some((item) => item.id === itemId)) {
      return { added: false, synced: true };
    }

    const nextItem = createCustomSavedBlendItem(option);
    const updatedTeaBox = [nextItem, ...savedBlendItems];
    setSavedBlendItems(updatedTeaBox);
    await saveTeaBox(updatedTeaBox);

    try {
      await syncSavedCustomBlendToFirestore({ option, memberProfile });
      return { added: true, synced: true };
    } catch (error) {
      console.warn('Failed to sync saved custom blend to Firestore', error);
      return { added: true, synced: false };
    }
  };

  const saveCWaterBlendToBox = async (
    result: CWaterBlendResult,
    cacaoNibLevel: number | null = null,
    teaRatios: Record<string, number> | null = null
  ) => {
    const itemId = createCWaterBlendItemId(result, cacaoNibLevel, teaRatios);

    if (savedBlendItems.some((item) => item.id === itemId)) {
      return { added: false, synced: true };
    }

    const nextItem = createCWaterSavedBlendItem(result, cacaoNibLevel, teaRatios);
    const updatedTeaBox = [nextItem, ...savedBlendItems];
    setSavedBlendItems(updatedTeaBox);
    await saveTeaBox(updatedTeaBox);

    try {
      await syncSavedCWaterBlendToFirestore({ result, cacaoNibLevel, teaRatios, memberProfile });
      return { added: true, synced: true };
    } catch (error) {
      console.warn('Failed to sync saved C.Water blend to Firestore', error);
      return { added: true, synced: false };
    }
  };

  const removeSavedBlendFromBox = async (itemId: string) => {
    if (!savedBlendItems.some((item) => item.id === itemId)) {
      return { removed: false };
    }

    const updatedTeaBox = savedBlendItems.filter((item) => item.id !== itemId);
    setSavedBlendItems(updatedTeaBox);
    await saveTeaBox(updatedTeaBox);

    try {
      await syncRemovedBlendFromFirestore({ itemId, memberProfile });
    } catch (error) {
      console.warn('Failed to sync removed blend to Firestore', error);
    }

    return { removed: true };
  };

  const removeTeaFromBox = async (teaId: TeaRecommendationId) => {
    return removeSavedBlendFromBox(teaId);
  };

  return (
    <StoreContext.Provider value={{ logs, addLog, getTodayLog, userSettings, updateSettings, latestLogFeedback, clearLatestLogFeedback, memberProfile, savedBlendItems, savedTeaIds, saveTeaToBox, saveCustomBlendToBox, saveCWaterBlendToBox, removeSavedBlendFromBox, removeTeaFromBox, syncStatus, syncStatusMessage, clearSyncStatusMessage, isReady }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
