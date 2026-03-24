import { NextResponse } from 'next/server';
import { MILLY_PUBLIC_KEY, TOKEN_UNIVERSE } from '@/lib/mock-data';
import { AgentThought, MoodState, Position, RuntimeMetrics, TradeTransaction } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const COINGECKO_ID_BY_SYMBOL: Record<string, string> = {
  SOL: 'solana',
  BONK: 'bonk',
  WIF: 'dogwifcoin',
  BOME: 'book-of-meme',
  POPCAT: 'popcat',
  MYRO: 'myro',
  SLERF: 'slerf',
  MEW: 'cat-in-a-dogs-world',
};

const tokenByMint = new Map(TOKEN_UNIVERSE.map((token) => [token.address, token]));

type DexQuote = {
  priceUsd: number;
  change24hPct: number;
  symbol: string;
  name: string;
};

const dexCache = new Map<string, { value: DexQuote | null; expiresAt: number }>();

async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`RPC status ${response.status}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(`RPC error ${json.error.code}: ${json.error.message}`);
  }

  return json.result as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function moodFromMarket(change24hPct: number, winRatePct: number): MoodState {
  if (change24hPct >= 2.2 && winRatePct >= 58) return 'Predatory';
  if (change24hPct <= -2.5) return 'Cautious';
  if (Math.abs(change24hPct) <= 0.9) return 'Analytical';
  return 'Opportunistic';
}

function riskFromMarket(change24hPct: number, maxDrawdownPct: number, confidence: number): 'Low' | 'Medium' | 'High' {
  if (change24hPct <= -5 || maxDrawdownPct <= -9 || confidence < 55) return 'High';
  if (change24hPct <= -2 || maxDrawdownPct <= -4 || confidence < 70) return 'Medium';
  return 'Low';
}

async function fetchCoinGecko() {
  const ids = Object.values(COINGECKO_ID_BY_SYMBOL).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`CoinGecko status ${response.status}`);
  }

  const data = (await response.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
  const prices: Record<string, number> = {};
  const changes: Record<string, number> = {};

  for (const token of TOKEN_UNIVERSE) {
    const id = COINGECKO_ID_BY_SYMBOL[token.symbol];
    const row = id ? data[id] : undefined;
    prices[token.symbol] = row?.usd ?? token.basePriceUsd;
    changes[token.symbol] = row?.usd_24h_change ?? 0;
  }

  return { prices, changes };
}

async function fetchDexQuote(mint: string): Promise<DexQuote | null> {
  const now = Date.now();
  const cached = dexCache.get(mint);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { cache: 'no-store' });
    if (!response.ok) {
      dexCache.set(mint, { value: null, expiresAt: now + 60_000 });
      return null;
    }

    const json = (await response.json()) as {
      pairs?: Array<{
        chainId?: string;
        liquidity?: { usd?: number };
        priceUsd?: string;
        priceChange?: { h24?: number };
        baseToken?: { symbol?: string; name?: string };
      }>;
    };

    const bestPair = (json.pairs ?? [])
      .filter((pair) => pair.chainId === 'solana')
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

    if (!bestPair?.priceUsd) {
      dexCache.set(mint, { value: null, expiresAt: now + 60_000 });
      return null;
    }

    const quote: DexQuote = {
      priceUsd: Number(bestPair.priceUsd),
      change24hPct: Number(bestPair.priceChange?.h24 ?? 0),
      symbol: bestPair.baseToken?.symbol ?? `${mint.slice(0, 4)}...${mint.slice(-4)}`,
      name: bestPair.baseToken?.name ?? 'Unknown Token',
    };

    dexCache.set(mint, { value: quote, expiresAt: now + 120_000 });
    return quote;
  } catch {
    dexCache.set(mint, { value: null, expiresAt: now + 60_000 });
    return null;
  }
}

async function fetchTransactions(owner: string, solPrice: number, defaultMood: MoodState): Promise<TradeTransaction[]> {
  type SignatureItem = {
    signature: string;
    slot: number;
    blockTime: number | null;
    err: unknown;
    memo: string | null;
  };

  const signatures = await rpcCall<SignatureItem[]>('getSignaturesForAddress', [owner, { limit: 15 }]);

  const txs = await Promise.all(
    signatures.slice(0, 8).map(async (item, index): Promise<TradeTransaction> => {
      let deltaSol = 0;

      try {
        const tx = await rpcCall<{
          blockTime: number | null;
          transaction: { message: { accountKeys: Array<{ pubkey: string } | string> } };
          meta: { preBalances: number[]; postBalances: number[] };
        } | null>('getTransaction', [item.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);

        if (tx?.meta?.preBalances && tx?.meta?.postBalances) {
          const keys = tx.transaction.message.accountKeys.map((key) => (typeof key === 'string' ? key : key.pubkey));
          const ownerIndex = keys.findIndex((key) => key === owner);
          if (ownerIndex >= 0) {
            const pre = tx.meta.preBalances[ownerIndex] ?? 0;
            const post = tx.meta.postBalances[ownerIndex] ?? 0;
            deltaSol = (post - pre) / 1_000_000_000;
          }
        }
      } catch {
        deltaSol = 0;
      }

      const absSol = Math.abs(deltaSol);
      const action = deltaSol >= 0 ? 'BUY' : 'SELL';
      const usdValue = absSol * solPrice;

      return {
        id: `live-${item.slot}-${index}`,
        signature: item.signature,
        blockHeight: item.slot,
        symbol: 'SOL',
        tokenName: 'Solana',
        action,
        amount: absSol,
        priceUsd: solPrice,
        valueUsd: usdValue,
        realizedPnlUsd: null,
        realizedPnlPct: null,
        strategy: item.memo ? `Memo: ${item.memo}` : 'On-chain transaction flow',
        confidence: item.err ? 35 : 92,
        mood: item.err ? 'Cautious' : defaultMood,
        timestamp: new Date((item.blockTime ?? Math.floor(Date.now() / 1000)) * 1000),
      };
    }),
  );

  return txs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function computeMetrics(changeSeries: number[], totalEquityUsd: number): RuntimeMetrics {
  const wins = changeSeries.filter((value) => value > 0);
  const losses = changeSeries.filter((value) => value < 0);

  const winRatePct = changeSeries.length ? (wins.length / changeSeries.length) * 100 : 0;
  const grossGain = wins.reduce((sum, value) => sum + value, 0);
  const grossLoss = losses.reduce((sum, value) => sum + Math.abs(value), 0);
  const profitFactor = grossLoss > 0 ? grossGain / grossLoss : grossGain > 0 ? grossGain : 0;

  const mean = changeSeries.length ? changeSeries.reduce((a, b) => a + b, 0) / changeSeries.length : 0;
  const variance =
    changeSeries.length > 1 ? changeSeries.reduce((acc, value) => acc + (value - mean) ** 2, 0) / changeSeries.length : 0;
  const std = Math.sqrt(variance);
  const sharpeLike = std > 0 ? (mean / std) * Math.sqrt(changeSeries.length) : 0;
  const maxDrawdownPct = changeSeries.length ? Math.min(...changeSeries, 0) : 0;

  const realizedPnlUsd = totalEquityUsd * (mean / 100);

  return {
    totalTrades: 0,
    realizedPnlUsd: round(realizedPnlUsd, 2),
    winRatePct: round(winRatePct, 2),
    profitFactor: round(profitFactor, 2),
    sharpeLike: round(sharpeLike, 2),
    maxDrawdownPct: round(maxDrawdownPct, 2),
    openPositions: 0,
  };
}

function buildThoughts(
  mood: MoodState,
  change24hPct: number,
  solPrice: number,
  strongest: { symbol: string; change: number } | null,
  weakest: { symbol: string; change: number } | null,
): AgentThought[] {
  const now = Date.now();

  const lines = [
    `SOL spot at $${round(solPrice, 3)} with 24h move ${round(change24hPct, 2)}%.`,
    strongest ? `Top relative strength today: ${strongest.symbol} (${round(strongest.change, 2)}%).` : 'Scanning for top relative strength across tracked assets.',
    weakest ? `Weakest tracked asset: ${weakest.symbol} (${round(weakest.change, 2)}%).` : 'No major downside outlier detected in tracked set.',
    'Telemetry refreshed from Solana RPC + CoinGecko + DexScreener.',
  ];

  return lines.map((text, index) => ({
    id: `live-thought-${index}-${Math.floor(now / 1000)}`,
    mood,
    text,
    tag: index === 0 ? 'market' : index === 1 ? 'momentum' : index === 2 ? 'risk' : 'data',
    timestamp: new Date(now - index * 60_000),
  }));
}

export async function GET() {
  const startedAt = Date.now();
  const owner = process.env.MILLY_WALLET_ADDRESS ?? MILLY_PUBLIC_KEY;

  try {
    const { prices, changes } = await fetchCoinGecko();

    const [balanceResult, tokenAccountsResult] = await Promise.all([
      rpcCall<{ value: number }>('getBalance', [owner]),
      rpcCall<{
        value: Array<{
          account: {
            data: {
              parsed: {
                info: {
                  mint: string;
                  tokenAmount: { uiAmount: number | null; uiAmountString: string; decimals: number };
                };
              };
            };
          };
        }>;
      }>('getTokenAccountsByOwner', [owner, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding: 'jsonParsed' }]),
    ]);

    const solBalance = (balanceResult.value ?? 0) / 1_000_000_000;
    const solPrice = prices.SOL ?? TOKEN_UNIVERSE.find((token) => token.symbol === 'SOL')?.basePriceUsd ?? 0;

    let usdcBalance = 0;
    const positions: Position[] = [];
    const changeSeries: number[] = [];

    for (const account of tokenAccountsResult.value) {
      const parsedInfo = account.account.data.parsed.info;
      const mint = parsedInfo.mint;
      const amount = parsedInfo.tokenAmount.uiAmount ?? Number(parsedInfo.tokenAmount.uiAmountString || 0);
      if (!amount || amount <= 0) continue;

      if (mint === USDC_MINT) {
        usdcBalance += amount;
        continue;
      }

      const known = tokenByMint.get(mint);
      let symbol = known?.symbol;
      let name = known?.name;
      let priceUsd = known ? prices[known.symbol] : undefined;
      let change24hPct = known ? changes[known.symbol] : undefined;

      if (priceUsd === undefined || !Number.isFinite(priceUsd) || priceUsd <= 0) {
        const dex = await fetchDexQuote(mint);
        if (dex) {
          priceUsd = dex.priceUsd;
          change24hPct = dex.change24hPct;
          symbol = symbol ?? dex.symbol;
          name = name ?? dex.name;
        }
      }

      if (!priceUsd || priceUsd <= 0) {
        continue;
      }

      const tokenChange = change24hPct ?? 0;
      const referencePrice = tokenChange === -100 ? priceUsd : priceUsd / (1 + tokenChange / 100);
      const valueUsd = amount * priceUsd;
      const unrealizedPnlUsd = amount * (priceUsd - referencePrice);
      const unrealizedPnlPct = tokenChange;

      positions.push({
        symbol: symbol ?? `${mint.slice(0, 4)}...${mint.slice(-4)}`,
        name: name ?? 'Unmapped Token',
        address: mint,
        amount,
        avgEntryUsd: referencePrice,
        currentPriceUsd: priceUsd,
        valueUsd,
        unrealizedPnlUsd,
        unrealizedPnlPct,
      });

      changeSeries.push(tokenChange);
    }

    positions.sort((a, b) => b.valueUsd - a.valueUsd);

    const solValueUsd = solBalance * solPrice;
    const positionsValueUsd = positions.reduce((sum, position) => sum + position.valueUsd, 0);
    const totalEquityUsd = solValueUsd + usdcBalance + positionsValueUsd;

    const solChangePct = changes.SOL ?? 0;
    const weightedChangeUsd =
      solValueUsd * (solChangePct / 100) +
      positions.reduce((sum, position) => sum + position.valueUsd * (position.unrealizedPnlPct / 100), 0);
    const change24hPct = totalEquityUsd > 0 ? (weightedChangeUsd / totalEquityUsd) * 100 : 0;

    changeSeries.unshift(solChangePct);

    const metrics = computeMetrics(changeSeries, totalEquityUsd);
    metrics.openPositions = positions.length;

    const strongest = Object.entries(changes)
      .map(([symbol, change]) => ({ symbol, change }))
      .sort((a, b) => b.change - a.change)[0] ?? null;
    const weakest = Object.entries(changes)
      .map(([symbol, change]) => ({ symbol, change }))
      .sort((a, b) => a.change - b.change)[0] ?? null;

    const confidence = Math.round(
      clamp(55 + metrics.winRatePct * 0.35 + (change24hPct >= 0 ? 8 : -6) - Math.abs(metrics.maxDrawdownPct) * 0.9, 35, 97),
    );

    const mood = moodFromMarket(change24hPct, metrics.winRatePct);
    const riskLevel = riskFromMarket(change24hPct, metrics.maxDrawdownPct, confidence);
    const transactions = await fetchTransactions(owner, solPrice, mood);
    metrics.totalTrades = transactions.length;

    const thoughts = buildThoughts(mood, change24hPct, solPrice, strongest, weakest);

    const latencyMs = Date.now() - startedAt;

    return NextResponse.json(
      {
        fetchedAt: new Date().toISOString(),
        wallet: {
          publicKey: owner,
          network: 'Solana Mainnet',
          solBalance: round(solBalance, 6),
          usdcBalance: round(usdcBalance, 2),
          totalEquityUsd: round(totalEquityUsd, 2),
          change24hPct: round(change24hPct, 2),
        },
        prices,
        positions,
        transactions,
        thoughts,
        mood,
        confidence,
        latencyMs,
        riskLevel,
        metrics,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch live snapshot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
