'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MILLY_PUBLIC_KEY, TOKEN_UNIVERSE } from '@/lib/mock-data';
import { transactionsToCsv } from '@/lib/runtime-engine';
import { RuntimeContextValue, RuntimeSnapshot } from '@/lib/types';

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

const EMPTY_SNAPSHOT: RuntimeSnapshot = {
  wallet: {
    publicKey: MILLY_PUBLIC_KEY,
    network: 'Solana Mainnet',
    solBalance: 0,
    usdcBalance: 0,
    totalEquityUsd: 0,
    change24hPct: 0,
  },
  prices: Object.fromEntries(TOKEN_UNIVERSE.map((token) => [token.symbol, token.basePriceUsd])),
  positions: [],
  transactions: [],
  thoughts: [],
  equitySeries: [{ timestamp: new Date(), equityUsd: 0 }],
  mood: 'Analytical',
  confidence: 50,
  runtimeOn: true,
  latencyMs: 0,
  riskLevel: 'Medium',
  metrics: {
    totalTrades: 0,
    realizedPnlUsd: 0,
    winRatePct: 0,
    profitFactor: 0,
    sharpeLike: 0,
    maxDrawdownPct: 0,
    openPositions: 0,
  },
};

type LiveSnapshotPayload = Omit<RuntimeSnapshot, 'runtimeOn' | 'equitySeries'> & {
  fetchedAt: string;
};

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
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(EMPTY_SNAPSHOT);

  const applyLiveSnapshot = useCallback((payload: LiveSnapshotPayload) => {
    setSnapshot((prev) => {
      const nextPoint = {
        timestamp: new Date(payload.fetchedAt),
        equityUsd: payload.wallet.totalEquityUsd,
      };

      const prevSeries = prev.equitySeries.length > 0 ? prev.equitySeries : [{ timestamp: new Date(), equityUsd: payload.wallet.totalEquityUsd }];
      const shouldAppend =
        prevSeries[prevSeries.length - 1]?.equityUsd !== nextPoint.equityUsd ||
        Math.abs(new Date(prevSeries[prevSeries.length - 1].timestamp).getTime() - nextPoint.timestamp.getTime()) > 10_000;

      const equitySeries = shouldAppend ? [...prevSeries, nextPoint].slice(-320) : prevSeries;

      return {
        ...prev,
        ...payload,
        runtimeOn: prev.runtimeOn,
        equitySeries,
      };
    });
  }, []);

  const refreshLiveData = useCallback(async () => {
    const response = await fetch('/api/live-snapshot', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Live API status ${response.status}`);
    }

    const payload = (await response.json()) as LiveSnapshotPayload;
    applyLiveSnapshot(payload);
  }, [applyLiveSnapshot]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshLiveData().catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshLiveData]);

  useEffect(() => {
    if (!snapshot.runtimeOn) {
      return;
    }

    const timer = window.setInterval(() => {
      refreshLiveData().catch(() => undefined);
    }, 25_000);

    return () => window.clearInterval(timer);
  }, [snapshot.runtimeOn, refreshLiveData]);

  const actions = useMemo(
    () => ({
      toggleRuntime: () => {
        setSnapshot((prev) => {
          const next = { ...prev, runtimeOn: !prev.runtimeOn };
          if (!prev.runtimeOn) {
            refreshLiveData().catch(() => undefined);
          }
          return next;
        });
      },
      forceTrade: () => {
        refreshLiveData().catch(() => undefined);
      },
      rebalanceRisk: () => {
        refreshLiveData().catch(() => undefined);
      },
      exportTransactionsCsv: () => {
        const csv = transactionsToCsv(snapshot.transactions);
        downloadCsv(csv, `milly-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
      },
      resetDemo: () => {
        setSnapshot(EMPTY_SNAPSHOT);
        refreshLiveData().catch(() => undefined);
      },
    }),
    [refreshLiveData, snapshot.transactions],
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
