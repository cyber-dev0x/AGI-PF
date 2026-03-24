import { AgentThought, MoodState, TokenSpec, TradeAction, TradeTransaction } from '@/lib/types';

export const AGENT_NAME = 'Milly';
export const PROJECT_NAME = 'AGI PF';
export const CHAIN = 'Solana Mainnet';
export const SOLSCAN_ROOT = 'https://solscan.io';

export const MILLY_PUBLIC_KEY = 'VQwCCSfW3o5NDx7n5FBr9SoYiLXVgetstHvaWBvv2YH';

export const TOKEN_UNIVERSE: TokenSpec[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'So11111111111111111111111111111111111111112',
    basePriceUsd: 201.5,
    volatility: 0.014,
    liquidityUsd: 3_400_000_000,
  },
  {
    symbol: 'WIF',
    name: 'dogwifhat',
    address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fZSEhi8G2sTjMMa4t',
    basePriceUsd: 2.81,
    volatility: 0.068,
    liquidityUsd: 362_000_000,
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    basePriceUsd: 0.0000287,
    volatility: 0.082,
    liquidityUsd: 302_000_000,
  },
  {
    symbol: 'BOME',
    name: 'Book of Meme',
    address: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82',
    basePriceUsd: 0.0131,
    volatility: 0.091,
    liquidityUsd: 221_000_000,
  },
  {
    symbol: 'POPCAT',
    name: 'Popcat',
    address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    basePriceUsd: 0.61,
    volatility: 0.087,
    liquidityUsd: 97_000_000,
  },
  {
    symbol: 'MYRO',
    name: 'Myro',
    address: 'HhJpBh4mS72nKoEaVq6fDQ8M95QvJ6RxP6w1k6jDP8zL',
    basePriceUsd: 0.074,
    volatility: 0.095,
    liquidityUsd: 38_000_000,
  },
  {
    symbol: 'SLERF',
    name: 'SLERF',
    address: '7hA9qD8F4Lx4mP2d9w4qmr2AJxW2fgY2w6V8VfG7hGc2',
    basePriceUsd: 0.223,
    volatility: 0.11,
    liquidityUsd: 52_000_000,
  },
  {
    symbol: 'MEW',
    name: 'cat in a dogs world',
    address: 'MEW1w4yY2P7VQmHcg6R1za5m4r5QgY71m2Z5D6JgR7h',
    basePriceUsd: 0.0068,
    volatility: 0.1,
    liquidityUsd: 44_000_000,
  },
];

export const ACTION_STRATEGIES = {
  BUY: [
    'Detected liquidity sweep into high-conviction pocket.',
    'Clustered whale inflows and positive CVD divergence.',
    'Narrative acceleration with rising social velocity.',
    'Breakout from compression zone on volume confirmation.',
    'Mempool imbalance favors aggressive upside continuation.',
  ],
  SELL: [
    'Momentum exhaustion and early distribution pattern.',
    'Risk budget exceeded, trimming into strength.',
    'Failed follow-through above local resistance.',
    'Microstructure shifted to passive sell pressure.',
    'Rotation signal: reallocating to higher expected value.',
  ],
} satisfies Record<TradeAction, string[]>;

export const THOUGHT_TAGS = ['order-flow', 'risk', 'alpha', 'volatility', 'narrative', 'execution'];

export const MOOD_TEXT: Record<MoodState, string> = {
  Predatory: 'Milly is pressing into asymmetric setups.',
  Analytical: 'Milly is mapping probability and cross-signals.',
  Cautious: 'Milly is preserving capital and waiting for clean structure.',
  Opportunistic: 'Milly is rotating quickly across short-lived edge.',
};

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

function hashLike(size: number): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let out = '';
  for (let i = 0; i < size; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function txTemplate(
  id: number,
  action: TradeAction,
  symbol: string,
  tokenName: string,
  amount: number,
  priceUsd: number,
  minutesBack: number,
  mood: MoodState,
  confidence: number,
  strategy: string,
  pnl?: { usd: number; pct: number },
): TradeTransaction {
  const valueUsd = amount * priceUsd;
  return {
    id: `seed-${id}`,
    signature: hashLike(88),
    blockHeight: 286_900_000 + id * 23,
    symbol,
    tokenName,
    action,
    amount,
    priceUsd,
    valueUsd,
    realizedPnlUsd: pnl ? pnl.usd : null,
    realizedPnlPct: pnl ? pnl.pct : null,
    strategy,
    confidence,
    mood,
    timestamp: minutesAgo(minutesBack),
  };
}

export function seedTransactions(): TradeTransaction[] {
  return [
    txTemplate(1, 'BUY', 'BONK', 'Bonk', 12_400_000_000, 0.0000289, 6, 'Predatory', 89, ACTION_STRATEGIES.BUY[0]),
    txTemplate(2, 'SELL', 'POPCAT', 'Popcat', 34_500, 0.627, 14, 'Analytical', 85, ACTION_STRATEGIES.SELL[0], {
      usd: 1324.2,
      pct: 31.7,
    }),
    txTemplate(3, 'BUY', 'WIF', 'dogwifhat', 4_200, 2.84, 23, 'Predatory', 83, ACTION_STRATEGIES.BUY[2]),
    txTemplate(4, 'SELL', 'MYRO', 'Myro', 54_000, 0.069, 37, 'Cautious', 71, ACTION_STRATEGIES.SELL[2], {
      usd: -241.7,
      pct: -9.5,
    }),
    txTemplate(5, 'BUY', 'BOME', 'Book of Meme', 380_000, 0.0128, 48, 'Opportunistic', 79, ACTION_STRATEGIES.BUY[3]),
    txTemplate(6, 'SELL', 'SLERF', 'SLERF', 18_900, 0.241, 72, 'Analytical', 74, ACTION_STRATEGIES.SELL[4], {
      usd: 582.3,
      pct: 14.2,
    }),
    txTemplate(7, 'BUY', 'MEW', 'cat in a dogs world', 1_400_000, 0.0067, 88, 'Opportunistic', 76, ACTION_STRATEGIES.BUY[1]),
    txTemplate(8, 'BUY', 'WIF', 'dogwifhat', 3_100, 2.74, 106, 'Predatory', 82, ACTION_STRATEGIES.BUY[4]),
    txTemplate(9, 'SELL', 'BONK', 'Bonk', 4_800_000_000, 0.0000306, 131, 'Opportunistic', 86, ACTION_STRATEGIES.SELL[1], {
      usd: 894.5,
      pct: 21.4,
    }),
    txTemplate(10, 'SELL', 'BOME', 'Book of Meme', 210_000, 0.0136, 160, 'Analytical', 80, ACTION_STRATEGIES.SELL[3], {
      usd: 410.2,
      pct: 8.7,
    }),
    txTemplate(11, 'BUY', 'POPCAT', 'Popcat', 22_000, 0.582, 189, 'Predatory', 78, ACTION_STRATEGIES.BUY[0]),
    txTemplate(12, 'SELL', 'WIF', 'dogwifhat', 2_700, 2.63, 215, 'Cautious', 68, ACTION_STRATEGIES.SELL[2], {
      usd: -318.7,
      pct: -4.3,
    }),
  ];
}

export function seedThoughts(): AgentThought[] {
  return [
    {
      id: 'thought-1',
      mood: 'Predatory',
      text: 'BONK liquidity pockets are stacking beneath local highs. Front-running breakout ladder.',
      tag: 'order-flow',
      timestamp: minutesAgo(2),
    },
    {
      id: 'thought-2',
      mood: 'Analytical',
      text: 'WIF volatility normalized after Asia close. Reopening directional risk with tighter invalidation.',
      tag: 'volatility',
      timestamp: minutesAgo(8),
    },
    {
      id: 'thought-3',
      mood: 'Cautious',
      text: 'Observed slippage widening on low-float pairs. Cutting sizing while spreads remain unstable.',
      tag: 'risk',
      timestamp: minutesAgo(17),
    },
    {
      id: 'thought-4',
      mood: 'Opportunistic',
      text: 'Narrative shift from dog meta to cat meta gaining velocity. Rotating small probe into MEW.',
      tag: 'narrative',
      timestamp: minutesAgo(31),
    },
  ];
}

export function findToken(symbol: string): TokenSpec | undefined {
  return TOKEN_UNIVERSE.find((token) => token.symbol === symbol);
}
