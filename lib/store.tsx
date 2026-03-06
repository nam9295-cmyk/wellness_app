import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, WellnessLog, WellnessLogInput } from '@/types';
import { loadLogs, saveLogs } from './storage';
import { loadUserSettings, saveUserSettings } from './userStorage';
import { createWellnessLog, findTodayLog, upsertLog } from './logUtils';

interface StoreContextType {
  logs: WellnessLog[];
  addLog: (log: WellnessLogInput) => Promise<void>;
  getTodayLog: () => WellnessLog | undefined;
  userSettings: UserSettings | null;
  updateSettings: (settings: UserSettings) => Promise<void>;
  isReady: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 앱 로드시 저장된 데이터 불러오기
  useEffect(() => {
    let isMounted = true;
    const initializeStore = async () => {
      const storedLogs = await loadLogs();
      const storedSettings = await loadUserSettings();
      
      if (isMounted) {
        setLogs(storedLogs);
        setUserSettings(storedSettings);
        setIsReady(true);
      }
    };
    initializeStore();
    return () => { isMounted = false; };
  }, []);

  const addLog = async (logData: WellnessLogInput) => {
    const newLog = createWellnessLog(logData);
    const updatedLogs = upsertLog(logs, newLog);

    setLogs(updatedLogs);
    await saveLogs(updatedLogs);
  };

  const getTodayLog = () => {
    return findTodayLog(logs);
  };

  const updateSettings = async (settings: UserSettings) => {
    setUserSettings(settings);
    await saveUserSettings(settings);
  };

  return (
    <StoreContext.Provider value={{ logs, addLog, getTodayLog, userSettings, updateSettings, isReady }}>
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
