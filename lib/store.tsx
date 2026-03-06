import React, { createContext, useContext, useState } from 'react';
import { WellnessLog } from '@/types';

interface StoreContextType {
  logs: WellnessLog[];
  addLog: (log: Omit<WellnessLog, 'id'>) => void;
  getTodayLog: () => WellnessLog | undefined;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// 초기 더미 데이터 작성
const MOCK_DATA: WellnessLog[] = [
  {
    id: '1',
    date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    sleep: '보통',
    fatigue: 3,
    mood: 4,
    meal: '균형적',
    exercise: '가볍게',
    water: '보통',
    memo: '어제는 꽤 괜찮은 하루였다.',
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    sleep: '부족',
    fatigue: 4,
    mood: 2,
    meal: '불규칙',
    exercise: '안 함',
    water: '부족',
    memo: '야근해서 피곤했다.',
  }
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<WellnessLog[]>(MOCK_DATA);

  const addLog = (logData: Omit<WellnessLog, 'id'>) => {
    const newLog: WellnessLog = { ...logData, id: Date.now().toString() };
    setLogs((prev) => {
      // 이미 오늘 기록이 있다면 덮어쓰기
      const existingIndex = prev.findIndex(l => l.date === logData.date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newLog;
        return updated;
      }
      return [newLog, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
  };

  const getTodayLog = () => {
    const today = new Date().toISOString().split('T')[0];
    return logs.find(l => l.date === today);
  };

  return (
    <StoreContext.Provider value={{ logs, addLog, getTodayLog }}>
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
