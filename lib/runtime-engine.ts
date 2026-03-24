import {
  ACTION_STRATEGIES,
  MOOD_TEXT,
  THOUGHT_TAGS,
  TOKEN_UNIVERSE,
  seedThoughts,
  seedTransactions,
  MILLY_PUBLIC_KEY,
  findToken,
} from '@/lib/mock-data';
import {
  AgentThought,
  EquityPoint,
  MoodState,
  Position,
  RuntimeMetrics,
  RuntimeSnapshot,
  TokenSpec,
  TradeAction,
  TradeTransaction,
} from '@/lib/types';

const MAX_TRANSACTIONS = 180;
const MAX_THOUGHTS = 60;
const MAX_EQUITY_POINTS = 320;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function createSignature(size = 88): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let out = '';
  for (let i = 0; i < size; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function moodByPnl(pnl: number | null): MoodState {
  if (pnl === null) {
    return Math.random() > 0.5 ? 'Predatory' : 'Analytical';
  }
  if (pnl > 0) {
    return Math.random() > 0.4 ? 'Opportunistic' : 'Predatory';
  }
  return Math.random() > 0.3 ? 'Cautious' : 'Analytical';
}

function buildPrices(): Record<string, number> {
  return TOKEN_UNIVERSE.reduce<Record<string, number>>((acc, token) => {
    const jitter = randomBetween(-0.03, 0.03);
    acc[token.symbol] = round(token.basePriceUsd * (1 + jitter), token.basePriceUsd < 0.1 ? 8 : 4);
    return acc;
  }, {});
}

function getTokenOrThrow(symbol: string): TokenSpec {
  const token = findToken(symbol);
  if (!token) {
    throw new Error(`Token ${symbol} not found in universe`);
  }
  return token;
}

function makePosition(symbol: string, amount: number, avgEntryUsd: number, prices: Record<string, number>): Position {
  const token = getTokenOrThrow(symbol);
  const currentPriceUsd = prices[symbol] ?? token.basePriceUsd;
  const valueUsd = amount * currentPriceUsd;
  const unrealizedPnlUsd = (currentPriceUsd - avgEntryUsd) * amount;
  const unrealizedPnlPct = avgEntryUsd > 0 ? (currentPriceUsd / avgEntryUsd - 1) * 100 : 0;

  return {
    symbol,
    name: token.name,
    address: token.address,
    amount,
    avgEntryUsd,
    currentPriceUsd,
    valueUsd,
    unrealizedPnlUsd,
    unrealizedPnlPct,
  };
}

function revaluePositions(positions: Position[], prices: Record<string, number>): Position[] {
  return positions
    .map((position) => {
      const currentPriceUsd = prices[position.symbol] ?? position.currentPriceUsd;
      const valueUsd = position.amount * currentPriceUsd;
      const unrealizedPnlUsd = (currentPriceUsd - position.avgEntryUsd) * position.amount;
      const unrealizedPnlPct = position.avgEntryUsd > 0 ? (currentPriceUsd / position.avgEntryUsd - 1) * 100 : 0;

      return {
        ...position,
        currentPriceUsd,
        valueUsd,
        unrealizedPnlUsd,
        unrealizedPnlPct,
      };
    })
    .filter((position) => position.amount > 0.0000001);
}

function calculateTotalEquityUsd(solBalance: number, usdcBalance: number, prices: Record<string, number>, positions: Position[]): number {
  const positionsValue = positions.reduce((sum, position) => sum + position.valueUsd, 0);
  const solValue = solBalance * (prices.SOL ?? 0);
  return usdcBalance + solValue + positionsValue;
}

function generateEquitySeries(currentEquityUsd: number): EquityPoint[] {
  const points: EquityPoint[] = [];
  const now = Date.now();
  let value = currentEquityUsd * randomBetween(0.85, 0.92);

  for (let i = 96; i > 0; i -= 1) {
    const drift = (currentEquityUsd - value) / (i + 10);
    const noise = (Math.random() - 0.48) * currentEquityUsd * 0.004;
    value = Math.max(10_000, value + drift + noise);
    points.push({
      timestamp: new Date(now - i * 15 * 60_000),
      equityUsd: round(value, 2),
    });
  }

  points.push({ timestamp: new Date(now), equityUsd: round(currentEquityUsd, 2) });
  return points;
}

function calculateMetrics(transactions: TradeTransaction[], equitySeries: EquityPoint[], positions: Position[]): RuntimeMetrics {
  const sells = transactions.filter((tx) => tx.realizedPnlUsd !== null);
  const wins = sells.filter((tx) => (tx.realizedPnlUsd ?? 0) > 0).length;

  const realizedPnlUsd = sells.reduce((sum, tx) => sum + (tx.realizedPnlUsd ?? 0), 0);
  const grossProfit = sells.reduce((sum, tx) => sum + Math.max(tx.realizedPnlUsd ?? 0, 0), 0);
  const grossLoss = sells.reduce((sum, tx) => sum + Math.min(tx.realizedPnlUsd ?? 0, 0), 0);
  const profitFactor = Math.abs(grossLoss) < 0.001 ? grossProfit : grossProfit / Math.abs(grossLoss);

  let peak = equitySeries[0]?.equityUsd ?? 1;
  let maxDrawdown = 0;
  for (const point of equitySeries) {
    if (point.equityUsd > peak) {
      peak = point.equityUsd;
    }
    const drawdown = ((point.equityUsd - peak) / peak) * 100;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const returns: number[] = [];
  for (let i = 1; i < equitySeries.length; i += 1) {
    const prev = equitySeries[i - 1].equityUsd;
    const next = equitySeries[i].equityUsd;
    if (prev > 0) {
      returns.push((next - prev) / prev);
    }
  }
  const mean = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 0 ? returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / returns.length : 0;
  const std = Math.sqrt(variance);
  const sharpeLike = std > 0 ? (mean / std) * Math.sqrt(returns.length) : 0;

  return {
    totalTrades: transactions.length,
    realizedPnlUsd: round(realizedPnlUsd, 2),
    winRatePct: sells.length > 0 ? round((wins / sells.length) * 100, 2) : 0,
    profitFactor: round(profitFactor, 2),
    sharpeLike: round(sharpeLike, 2),
    maxDrawdownPct: round(maxDrawdown, 2),
    openPositions: positions.length,
  };
}

function deriveRiskLevel(metrics: RuntimeMetrics, confidence: number): RuntimeSnapshot['riskLevel'] {
  if (metrics.maxDrawdownPct <= -12 || metrics.winRatePct < 55 || confidence < 62) {
    return 'High';
  }
  if (metrics.maxDrawdownPct <= -7 || metrics.winRatePct < 64 || confidence < 74) {
    return 'Medium';
  }
  return 'Low';
}

function randomThought(mood: MoodState, trade?: TradeTransaction): AgentThought {
  const now = new Date();

  if (trade) {
    const pnlText =
      trade.realizedPnlUsd === null
        ? `${trade.action} ${trade.symbol} at ${round(trade.priceUsd, trade.priceUsd < 0.1 ? 6 : 3)}.`
        : `Closed ${trade.symbol} ${trade.realizedPnlUsd >= 0 ? 'green' : 'red'} at ${round(trade.realizedPnlUsd, 2)} USD.`;

    return {
      id: createId('thought'),
      mood,
      text: `${pnlText} ${MOOD_TEXT[mood]}`,
      tag: pick(THOUGHT_TAGS),
      timestamp: now,
    };
  }

  return {
    id: createId('thought'),
    mood,
    text: `${MOOD_TEXT[mood]} Monitoring liquidity and spread response in real time.`,
    tag: pick(THOUGHT_TAGS),
    timestamp: now,
  };
}

function updatePrices(prices: Record<string, number>): Record<string, number> {
  const next = { ...prices };

  for (const token of TOKEN_UNIVERSE) {
    if (token.symbol === 'USDC') {
      continue;
    }
    const baseMove = randomBetween(-1, 1) * token.volatility * 0.42;
    const microNoise = randomBetween(-0.003, 0.003);
    const candidate = prices[token.symbol] * (1 + baseMove + microNoise);
    const floor = token.basePriceUsd * 0.45;
    const ceil = token.basePriceUsd * 2.4;
    next[token.symbol] = round(clamp(candidate, floor, ceil), token.basePriceUsd < 0.1 ? 8 : 4);
  }

  return next;
}

function chooseTradeAction(positions: Position[], usdcBalance: number, forceSell = false): TradeAction {
  if (forceSell) {
    return 'SELL';
  }
  if (positions.length === 0) {
    return 'BUY';
  }
  if (usdcBalance < 6_000) {
    return 'SELL';
  }
  return Math.random() > 0.47 ? 'BUY' : 'SELL';
}

function createTrade(
  snapshot: RuntimeSnapshot,
  prices: Record<string, number>,
  positions: Position[],
  forceSell = false,
): { positions: Position[]; walletUsdc: number; transaction: TradeTransaction | null; mood: MoodState; confidence: number } {
  const action = chooseTradeAction(positions, snapshot.wallet.usdcBalance, forceSell);

  if (action === 'BUY') {
    const candidates = TOKEN_UNIVERSE.filter((token) => token.symbol !== 'SOL');
    const token = pick(candidates);
    const priceUsd = prices[token.symbol] ?? token.basePriceUsd;

    const budget = clamp(
      snapshot.wallet.usdcBalance * randomBetween(forceSell ? 0.03 : 0.05, forceSell ? 0.07 : 0.14),
      500,
      forceSell ? 2_500 : 8_000,
    );

    if (budget >= snapshot.wallet.usdcBalance - 300) {
      return {
        positions,
        walletUsdc: snapshot.wallet.usdcBalance,
        transaction: null,
        mood: 'Cautious',
        confidence: clamp(snapshot.confidence - 3, 55, 96),
      };
    }

    const amount = budget / priceUsd;
    const existing = positions.find((position) => position.symbol === token.symbol);

    if (existing) {
      const totalCost = existing.avgEntryUsd * existing.amount + budget;
      const totalAmount = existing.amount + amount;
      existing.amount = totalAmount;
      existing.avgEntryUsd = totalCost / totalAmount;
    } else {
      positions.push(makePosition(token.symbol, amount, priceUsd * randomBetween(0.97, 1.01), prices));
    }

    const mood: MoodState = Math.random() > 0.4 ? 'Predatory' : 'Opportunistic';
    const confidence = clamp(snapshot.confidence + randomBetween(-2, 3), 58, 98);

    return {
      positions,
      walletUsdc: round(snapshot.wallet.usdcBalance - budget, 2),
      transaction: {
        id: createId('tx'),
        signature: createSignature(),
        blockHeight: (snapshot.transactions[0]?.blockHeight ?? 286_900_000) + Math.floor(randomBetween(5, 40)),
        symbol: token.symbol,
        tokenName: token.name,
        action: 'BUY',
        amount,
        priceUsd,
        valueUsd: budget,
        realizedPnlUsd: null,
        realizedPnlPct: null,
        strategy: pick(ACTION_STRATEGIES.BUY),
        confidence: Math.round(confidence),
        mood,
        timestamp: new Date(),
      },
      mood,
      confidence,
    };
  }

  const candidates = positions.filter((position) => position.amount > 0);
  if (candidates.length === 0) {
    return {
      positions,
      walletUsdc: snapshot.wallet.usdcBalance,
      transaction: null,
      mood: 'Analytical',
      confidence: snapshot.confidence,
    };
  }

  const target = forceSell
    ? [...candidates].sort((a, b) => b.valueUsd - a.valueUsd)[0]
    : pick(candidates);

  const sellFraction = forceSell ? randomBetween(0.35, 0.58) : randomBetween(0.22, 0.48);
  const amount = target.amount * sellFraction;
  const priceUsd = prices[target.symbol] ?? target.currentPriceUsd;
  const proceeds = amount * priceUsd;
  const cost = amount * target.avgEntryUsd;
  const realizedPnlUsd = proceeds - cost;
  const realizedPnlPct = target.avgEntryUsd > 0 ? (priceUsd / target.avgEntryUsd - 1) * 100 : 0;

  target.amount -= amount;

  const remaining = positions.filter((position) => position.amount > 0.000001);
  const mood = moodByPnl(realizedPnlUsd);
  const confidence = clamp(snapshot.confidence + randomBetween(-6, 4), 52, 96);

  return {
    positions: remaining,
    walletUsdc: round(snapshot.wallet.usdcBalance + proceeds, 2),
    transaction: {
      id: createId('tx'),
      signature: createSignature(),
      blockHeight: (snapshot.transactions[0]?.blockHeight ?? 286_900_000) + Math.floor(randomBetween(5, 40)),
      symbol: target.symbol,
      tokenName: target.name,
      action: 'SELL',
      amount,
      priceUsd,
      valueUsd: proceeds,
      realizedPnlUsd,
      realizedPnlPct,
      strategy: pick(ACTION_STRATEGIES.SELL),
      confidence: Math.round(confidence),
      mood,
      timestamp: new Date(),
    },
    mood,
    confidence,
  };
}

export function createInitialSnapshot(): RuntimeSnapshot {
  const prices = buildPrices();
  let positions: Position[] = [
    makePosition('WIF', 16_900, 2.58, prices),
    makePosition('BONK', 2_180_000_000, 0.0000258, prices),
    makePosition('BOME', 1_730_000, 0.0119, prices),
    makePosition('POPCAT', 43_000, 0.552, prices),
    makePosition('MYRO', 112_000, 0.071, prices),
  ];
  positions = revaluePositions(positions, prices);

  const solBalance = 71.84;
  const usdcBalance = 24_680.4;
  const totalEquityUsd = calculateTotalEquityUsd(solBalance, usdcBalance, prices, positions);
  const equitySeries = generateEquitySeries(totalEquityUsd);

  const change24hPct =
    equitySeries.length > 1
      ? round(((totalEquityUsd - equitySeries[0].equityUsd) / equitySeries[0].equityUsd) * 100, 2)
      : 0;

  const transactions = seedTransactions().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const thoughts = seedThoughts().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const metrics = calculateMetrics(transactions, equitySeries, positions);
  const confidence = 84;

  return {
    wallet: {
      publicKey: MILLY_PUBLIC_KEY,
      network: 'Solana Mainnet',
      solBalance,
      usdcBalance,
      totalEquityUsd: round(totalEquityUsd, 2),
      change24hPct,
    },
    prices,
    positions,
    transactions,
    thoughts,
    equitySeries,
    mood: 'Predatory',
    confidence,
    runtimeOn: true,
    latencyMs: 72,
    riskLevel: deriveRiskLevel(metrics, confidence),
    metrics,
  };
}

export function stepRuntime(snapshot: RuntimeSnapshot, options?: { forceTrade?: boolean; rebalance?: boolean }): RuntimeSnapshot {
  const nextPrices = updatePrices(snapshot.prices);
  let nextPositions = revaluePositions(snapshot.positions.map((position) => ({ ...position })), nextPrices);

  let nextWalletUsdc = snapshot.wallet.usdcBalance;
  let nextMood = snapshot.mood;
  let nextConfidence = clamp(snapshot.confidence + randomBetween(-2.5, 2.8), 54, 98);
  let generatedTrade: TradeTransaction | null = null;

  const shouldTrade = options?.forceTrade || Math.random() < 0.42 || options?.rebalance;
  if (shouldTrade) {
    const tradeResult = createTrade(snapshot, nextPrices, nextPositions, Boolean(options?.rebalance));
    nextPositions = revaluePositions(tradeResult.positions, nextPrices);
    nextWalletUsdc = tradeResult.walletUsdc;
    generatedTrade = tradeResult.transaction;
    nextMood = tradeResult.mood;
    nextConfidence = tradeResult.confidence;
  }

  const totalEquityUsd = calculateTotalEquityUsd(snapshot.wallet.solBalance, nextWalletUsdc, nextPrices, nextPositions);
  const nextEquitySeries = [...snapshot.equitySeries, { timestamp: new Date(), equityUsd: round(totalEquityUsd, 2) }].slice(-MAX_EQUITY_POINTS);

  const change24hPct =
    nextEquitySeries.length > 0
      ? round(((totalEquityUsd - nextEquitySeries[0].equityUsd) / nextEquitySeries[0].equityUsd) * 100, 2)
      : 0;

  const nextTransactions = generatedTrade
    ? [generatedTrade, ...snapshot.transactions].slice(0, MAX_TRANSACTIONS)
    : snapshot.transactions;

  const generatedThought = randomThought(nextMood, generatedTrade ?? undefined);
  const nextThoughts = [generatedThought, ...snapshot.thoughts].slice(0, MAX_THOUGHTS);

  const metrics = calculateMetrics(nextTransactions, nextEquitySeries, nextPositions);
  const riskLevel = deriveRiskLevel(metrics, nextConfidence);

  return {
    ...snapshot,
    wallet: {
      ...snapshot.wallet,
      usdcBalance: round(nextWalletUsdc, 2),
      totalEquityUsd: round(totalEquityUsd, 2),
      change24hPct,
    },
    prices: nextPrices,
    positions: nextPositions,
    transactions: nextTransactions,
    thoughts: nextThoughts,
    equitySeries: nextEquitySeries,
    mood: nextMood,
    confidence: Math.round(nextConfidence),
    latencyMs: Math.floor(randomBetween(58, 160)),
    riskLevel,
    metrics,
  };
}

export function transactionsToCsv(transactions: TradeTransaction[]): string {
  const header = [
    'timestamp',
    'signature',
    'blockHeight',
    'symbol',
    'action',
    'amount',
    'priceUsd',
    'valueUsd',
    'realizedPnlUsd',
    'realizedPnlPct',
    'confidence',
    'strategy',
  ];

  const rows = transactions.map((tx) => [
    tx.timestamp.toISOString(),
    tx.signature,
    tx.blockHeight,
    tx.symbol,
    tx.action,
    tx.amount,
    tx.priceUsd,
    tx.valueUsd,
    tx.realizedPnlUsd ?? '',
    tx.realizedPnlPct ?? '',
    tx.confidence,
    tx.strategy.replace(/,/g, ';'),
  ]);

  return [header, ...rows].map((row) => row.join(',')).join('\n');
}
