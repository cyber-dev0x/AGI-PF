'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowUpRight, Bot, ShieldCheck, Zap } from 'lucide-react';
import { useState } from 'react';
import { useMillyRuntime } from '@/components/runtime/MillyRuntimeProvider';
import { NeuralCore } from '@/components/visuals/NeuralCore';
import { formatPrice, formatSigned, formatUSD, moodBg, moodColor, shortSignature, timeAgo } from '@/lib/utils';

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const EquityChart = dynamic(() => import('@/components/charts/EquityChart').then((mod) => mod.EquityChart), {
  ssr: false,
  loading: () => <div className="scene-loading">Loading chart...</div>,
});

type ControlAction = 'runtime' | 'trade' | 'rebalance';

export default function DashboardPage() {
  const {
    wallet,
    metrics,
    prices,
    equitySeries,
    transactions,
    thoughts,
    mood,
    confidence,
    runtimeOn,
    toggleRuntime,
    forceTrade,
    rebalanceRisk,
  } = useMillyRuntime();
  const [activeControl, setActiveControl] = useState<ControlAction>('runtime');
  const [controlStatus, setControlStatus] = useState('Control panel ready.');

  const topTransactions = transactions.slice(0, 6);
  const topThoughts = thoughts.slice(0, 7);

  const handleControl = (action: ControlAction) => {
    setActiveControl(action);

    if (action === 'runtime') {
      toggleRuntime();
      setControlStatus(runtimeOn ? 'Runtime paused.' : 'Runtime resumed.');
      return;
    }

    if (action === 'trade') {
      forceTrade();
      setControlStatus('Manual trade cycle executed.');
      return;
    }

    rebalanceRisk();
    setControlStatus('Risk rebalance cycle executed.');
  };

  return (
    <>
      <motion.section className="panel panel-pad hero-grid" variants={reveal} initial="hidden" animate="visible" transition={{ duration: 0.42 }}>
        <div className="hero-copy">
          <span className="kicker">AGI Trading Intelligence</span>
          <h1 className="headline">Milly executes autonomous Solana meme-coin strategies in live runtime.</h1>
          <p>
            AGI PF gives full visibility into Milly&apos;s wallet state, autonomous execution logic, and equity progression.
            You can inspect every transaction, monitor confidence shifts, and trigger risk controls in real time.
          </p>

          <div className="hero-badges">
            <span className="hero-badge">Agent Mood: {mood}</span>
            <span className="hero-badge">Confidence: {confidence}%</span>
            <span className="hero-badge">Runtime: {runtimeOn ? 'Live' : 'Paused'}</span>
            <span className="hero-badge">SOL: {prices.SOL ? formatPrice(prices.SOL) : 'N/A'}</span>
          </div>

          <div className="hero-badges hero-controls">
            <button
              className={`runtime-btn ${activeControl === 'runtime' ? 'runtime-btn-primary runtime-btn-active' : ''}`}
              type="button"
              onClick={() => handleControl('runtime')}
              aria-pressed={activeControl === 'runtime'}
            >
              <Zap size={15} />
              {runtimeOn ? 'Pause Runtime' : 'Resume Runtime'}
            </button>
            <button
              className={`runtime-btn ${activeControl === 'trade' ? 'runtime-btn-primary runtime-btn-active' : ''}`}
              type="button"
              onClick={() => handleControl('trade')}
              aria-pressed={activeControl === 'trade'}
            >
              <Bot size={15} />
              Trigger Trade
            </button>
            <button
              className={`runtime-btn ${activeControl === 'rebalance' ? 'runtime-btn-primary runtime-btn-active' : ''}`}
              type="button"
              onClick={() => handleControl('rebalance')}
              aria-pressed={activeControl === 'rebalance'}
            >
              <ShieldCheck size={15} />
              Rebalance Risk
            </button>
          </div>

          <div className="control-status mono">{controlStatus}</div>
        </div>

        <div className="panel panel-pad" style={{ background: moodBg(mood), borderColor: `${moodColor(mood)}66` }}>
          <p className="kicker">Milly Core Simulation</p>
          <NeuralCore />
        </div>
      </motion.section>

      <motion.section className="kpi-grid" variants={reveal} initial="hidden" animate="visible" transition={{ delay: 0.08, duration: 0.42 }}>
        {[
          { label: 'Total Equity', value: formatUSD(wallet.totalEquityUsd), trend: formatSigned(wallet.change24hPct, '%') },
          { label: 'Realized PnL', value: formatUSD(metrics.realizedPnlUsd), trend: `${metrics.totalTrades} trades` },
          { label: 'Win Rate', value: formatSigned(metrics.winRatePct, '%'), trend: `PF ${metrics.profitFactor.toFixed(2)}` },
          { label: 'Max Drawdown', value: formatSigned(metrics.maxDrawdownPct, '%'), trend: `Sharpe ${metrics.sharpeLike.toFixed(2)}` },
        ].map((kpi) => (
          <article className="kpi-card" key={kpi.label}>
            <span className="kpi-label">{kpi.label}</span>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-trend">{kpi.trend}</div>
          </article>
        ))}
      </motion.section>

      <motion.section className="grid-2" variants={reveal} initial="hidden" animate="visible" transition={{ delay: 0.12, duration: 0.42 }}>
        <article className="panel panel-pad">
          <h2 className="panel-title">Equity Curve</h2>
          <p className="panel-subtitle">Real-time equity trace of Milly wallet and open positions.</p>
          <EquityChart data={equitySeries.slice(-120)} />
        </article>

        <article className="panel panel-pad">
          <h2 className="panel-title">Recent Trades</h2>
          <p className="panel-subtitle">Latest autonomous actions and rationale selected by the strategy engine.</p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Token</th>
                  <th>Value</th>
                  <th>PnL</th>
                  <th>Tx</th>
                </tr>
              </thead>
              <tbody>
                {topTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className={`table-inline-chip ${tx.action === 'BUY' ? 'buy' : 'sell'}`}>{tx.action}</span>
                    </td>
                    <td>
                      <strong>{tx.symbol}</strong>
                      <div className="feed-time">{timeAgo(tx.timestamp)}</div>
                    </td>
                    <td className="mono">{formatUSD(tx.valueUsd)}</td>
                    <td className={tx.realizedPnlUsd === null ? '' : tx.realizedPnlUsd >= 0 ? 'positive mono' : 'negative mono'}>
                      {tx.realizedPnlUsd === null ? 'Open' : formatUSD(tx.realizedPnlUsd)}
                    </td>
                    <td className="mono">{shortSignature(tx.signature)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </motion.section>

      <motion.section className="panel panel-pad" variants={reveal} initial="hidden" animate="visible" transition={{ delay: 0.16, duration: 0.42 }}>
        <h2 className="panel-title">Milly Thought Stream</h2>
        <p className="panel-subtitle">Live reasoning feed from the autonomous decision pipeline.</p>

        <div className="feed-list">
          {topThoughts.map((thought) => (
            <article className="feed-item" key={thought.id}>
              <div className="feed-item-head">
                <span className="feed-tag" style={{ borderColor: `${moodColor(thought.mood)}55`, color: moodColor(thought.mood) }}>
                  <ArrowUpRight size={12} />
                  {thought.tag}
                </span>
                <span className="feed-time">{timeAgo(thought.timestamp)}</span>
              </div>
              <p className="feed-text">{thought.text}</p>
            </article>
          ))}
        </div>
      </motion.section>
    </>
  );
}
