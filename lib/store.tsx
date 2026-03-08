import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeaRecommendationId } from '@/lib/teaRecommendationContent';
import { UserSettings, WellnessLog, WellnessLogInput } from '@/types';
import { loadLogs, saveLogs } from './storage';
import { loadTeaBox, saveTeaBox } from './teaBoxStorage';
import { loadUserSettings, saveUserSettings } from './userStorage';
import { createWellnessLog, findTodayLog, upsertLog } from './logUtils';

interface StoreContextType {
  logs: WellnessLog[];
  addLog: (log: WellnessLogInput) => Promise<void>;
  getTodayLog: () => WellnessLog | undefined;
  userSettings: UserSettings | null;
  updateSettings: (settings: UserSettings) => Promise<void>;
  latestLogFeedback: string | null;
  clearLatestLogFeedback: () => void;
  savedTeaIds: TeaRecommendationId[];
  saveTeaToBox: (teaId: TeaRecommendationId) => Promise<{ added: boolean }>;
  removeTeaFromBox: (teaId: TeaRecommendationId) => Promise<{ removed: boolean }>;
  isReady: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [latestLogFeedback, setLatestLogFeedback] = useState<string | null>(null);
  const [savedTeaIds, setSavedTeaIds] = useState<TeaRecommendationId[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 앱 로드시 저장된 데이터 불러오기
  useEffect(() => {
    let isMounted = true;
    const initializeStore = async () => {
      const storedLogs = await loadLogs();
      const storedSettings = await loadUserSettings();
      const storedTeaBox = await loadTeaBox();
      
      if (isMounted) {
        setLogs(storedLogs);
        setUserSettings(storedSettings);
        setSavedTeaIds(storedTeaBox);
        setIsReady(true);
      }
    };
    initializeStore();
    return () => { isMounted = false; };
  }, []);

  const addLog = async (logData: WellnessLogInput) => {
    const hasExistingLog = logs.some((log) => log.date === logData.date);
    const newLog = createWellnessLog(logData);
    const updatedLogs = upsertLog(logs, newLog);

    setLogs(updatedLogs);
    setLatestLogFeedback(
      hasExistingLog
        ? '수정 완료. 추천도 반영됐어요.'
        : '저장 완료. 추천도 업데이트됐어요.'
    );
    await saveLogs(updatedLogs);
  };

  const getTodayLog = () => {
    return findTodayLog(logs);
  };

  const updateSettings = async (settings: UserSettings) => {
    setUserSettings(settings);
    await saveUserSettings(settings);
  };

  const clearLatestLogFeedback = () => {
    setLatestLogFeedback(null);
  };

  const saveTeaToBox = async (teaId: TeaRecommendationId) => {
    if (savedTeaIds.includes(teaId)) {
      return { added: false };
    }

    const updatedTeaBox = [teaId, ...savedTeaIds];
    setSavedTeaIds(updatedTeaBox);
    await saveTeaBox(updatedTeaBox);

    return { added: true };
  };

  const removeTeaFromBox = async (teaId: TeaRecommendationId) => {
    if (!savedTeaIds.includes(teaId)) {
      return { removed: false };
    }

    const updatedTeaBox = savedTeaIds.filter((savedTeaId) => savedTeaId !== teaId);
    setSavedTeaIds(updatedTeaBox);
    await saveTeaBox(updatedTeaBox);

    return { removed: true };
  };

  return (
    <StoreContext.Provider value={{ logs, addLog, getTodayLog, userSettings, updateSettings, latestLogFeedback, clearLatestLogFeedback, savedTeaIds, saveTeaToBox, removeTeaFromBox, isReady }}>
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
