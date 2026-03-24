export type MoodState = 'Predatory' | 'Analytical' | 'Cautious' | 'Opportunistic';

export type TradeAction = 'BUY' | 'SELL';

export interface TokenSpec {
  symbol: string;
  name: string;
  address: string;
  basePriceUsd: number;
  volatility: number;
  liquidityUsd: number;
}

export interface Position {
  symbol: string;
  name: string;
  address: string;
  amount: number;
  avgEntryUsd: number;
  currentPriceUsd: number;
  valueUsd: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPct: number;
}

export interface TradeTransaction {
  id: string;
  signature: string;
  blockHeight: number;
  symbol: string;
  tokenName: string;
  action: TradeAction;
  amount: number;
  priceUsd: number;
  valueUsd: number;
  realizedPnlUsd: number | null;
  realizedPnlPct: number | null;
  strategy: string;
  confidence: number;
  mood: MoodState;
  timestamp: Date;
}

export interface AgentThought {
  id: string;
  mood: MoodState;
  text: string;
  tag: string;
  timestamp: Date;
}

export interface EquityPoint {
  timestamp: Date;
  equityUsd: number;
}

export interface MillyWallet {
  publicKey: string;
  network: 'Solana Mainnet';
  solBalance: number;
  usdcBalance: number;
  totalEquityUsd: number;
  change24hPct: number;
}

export interface RuntimeMetrics {
  totalTrades: number;
  realizedPnlUsd: number;
  winRatePct: number;
  profitFactor: number;
  sharpeLike: number;
  maxDrawdownPct: number;
  openPositions: number;
}

export interface RuntimeSnapshot {
  wallet: MillyWallet;
  prices: Record<string, number>;
  positions: Position[];
  transactions: TradeTransaction[];
  thoughts: AgentThought[];
  equitySeries: EquityPoint[];
  mood: MoodState;
  confidence: number;
  runtimeOn: boolean;
  latencyMs: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  metrics: RuntimeMetrics;
}

export interface RuntimeContextValue extends RuntimeSnapshot {
  toggleRuntime: () => void;
  forceTrade: () => void;
  rebalanceRisk: () => void;
  exportTransactionsCsv: () => void;
  resetDemo: () => void;
}
