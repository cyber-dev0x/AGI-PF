'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createInitialSnapshot, stepRuntime, transactionsToCsv } from '@/lib/runtime-engine';
import { RuntimeContextValue, RuntimeSnapshot } from '@/lib/types';

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function MillyRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(() => createInitialSnapshot());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSnapshot((prev) => (prev.runtimeOn ? stepRuntime(prev) : prev));
    }, 3_500);

    return () => window.clearInterval(timer);
  }, []);

  const actions = useMemo(
    () => ({
      toggleRuntime: () => {
        setSnapshot((prev) => ({ ...prev, runtimeOn: !prev.runtimeOn }));
      },
      forceTrade: () => {
        setSnapshot((prev) => stepRuntime(prev, { forceTrade: true }));
      },
      rebalanceRisk: () => {
        setSnapshot((prev) => stepRuntime(prev, { rebalance: true }));
      },
      exportTransactionsCsv: () => {
        const csv = transactionsToCsv(snapshot.transactions);
        downloadCsv(csv, `milly-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
      },
      resetDemo: () => {
        setSnapshot(createInitialSnapshot());
      },
    }),
    [snapshot.transactions],
  );

  const value: RuntimeContextValue = useMemo(
    () => ({
      ...snapshot,
      ...actions,
    }),
    [snapshot, actions],
  );

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

export function useMillyRuntime(): RuntimeContextValue {
  const context = useContext(RuntimeContext);
  if (!context) {
    throw new Error('useMillyRuntime must be used within MillyRuntimeProvider');
  }
  return context;
}
