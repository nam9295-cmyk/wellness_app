import React, { createContext, useContext, useState, useEffect } from 'react';
import { WellnessLog } from '@/types';
import { loadLogs, saveLogs } from './storage';

interface StoreContextType {
  logs: WellnessLog[];
  addLog: (log: Omit<WellnessLog, 'id'>) => void;
  getTodayLog: () => WellnessLog | undefined;
  isReady: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 앱 로드시 저장된 데이터 불러오기
  useEffect(() => {
    let isMounted = true;
    const initializeStore = async () => {
      const storedLogs = await loadLogs();
      if (isMounted) {
        setLogs(storedLogs);
        setIsReady(true);
      }
    };
    initializeStore();
    return () => { isMounted = false; };
  }, []);

  const addLog = (logData: Omit<WellnessLog, 'id'>) => {
    const newLog: WellnessLog = { ...logData, id: Date.now().toString() };
    setLogs((prev) => {
      let updated: WellnessLog[];
      
      const existingIndex = prev.findIndex(l => l.date === logData.date);
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = newLog;
      } else {
        updated = [newLog, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      }
      
      // 상태 업데이트 후 로컬 스토리지에 동기화
      saveLogs(updated);
      return updated;
    });
  };

  const getTodayLog = () => {
    const today = new Date().toISOString().split('T')[0];
    return logs.find(l => l.date === today);
  };

  return (
    <StoreContext.Provider value={{ logs, addLog, getTodayLog, isReady }}>
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
