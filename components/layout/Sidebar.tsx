'use client';

import { Download, Gauge, PauseCircle, PlayCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useMillyRuntime } from '@/components/runtime/MillyRuntimeProvider';
import { formatSigned, formatUSD, moodBg, moodColor, shortAddress } from '@/lib/utils';

function RuntimeButton({
  onClick,
  icon,
  label,
  variant = 'default',
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'primary';
}) {
  return (
    <button className={`runtime-btn runtime-btn-${variant}`} onClick={onClick} type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function Sidebar() {
  const {
    wallet,
    metrics,
    confidence,
    mood,
    riskLevel,
    latencyMs,
    runtimeOn,
    toggleRuntime,
    forceTrade,
    rebalanceRisk,
    exportTransactionsCsv,
    resetDemo,
  } = useMillyRuntime();

  return (
    <aside className="runtime-sidebar">
      <section className="sidebar-card sidebar-identity" style={{ background: moodBg(mood), borderColor: `${moodColor(mood)}66` }}>
        <div className="sidebar-identity-top">
          <span className="sidebar-kicker">Agent</span>
          <span className="sidebar-live" style={{ color: moodColor(mood) }}>
            <span className="status-dot" />
            {mood}
          </span>
        </div>

        <h3 className="sidebar-title">Milly / AGI Runtime</h3>
        <p className="sidebar-text">Non-custodial execution wallet on Solana mainnet with autonomous risk gating.</p>

        <div className="sidebar-grid">
          <div>
            <span className="stat-label">Confidence</span>
            <strong className="stat-value">{confidence}%</strong>
          </div>
          <div>
            <span className="stat-label">Risk</span>
            <strong className="stat-value">{riskLevel}</strong>
          </div>
          <div>
            <span className="stat-label">Latency</span>
            <strong className="stat-value">{latencyMs} ms</strong>
          </div>
          <div>
            <span className="stat-label">Wallet</span>
            <strong className="stat-value">{shortAddress(wallet.publicKey)}</strong>
          </div>
        </div>
      </section>

      <section className="sidebar-card">
        <div className="sidebar-actions">
          <RuntimeButton
            onClick={toggleRuntime}
            icon={runtimeOn ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
            label={runtimeOn ? 'Pause Runtime' : 'Resume Runtime'}
            variant="primary"
          />
          <RuntimeButton onClick={forceTrade} icon={<Sparkles size={15} />} label="Force Sync" />
          <RuntimeButton onClick={rebalanceRisk} icon={<Gauge size={15} />} label="Rebalance Risk" />
          <RuntimeButton onClick={exportTransactionsCsv} icon={<Download size={15} />} label="Export CSV" />
          <RuntimeButton onClick={resetDemo} icon={<RefreshCw size={15} />} label="Reset Demo" />
        </div>
      </section>

      <section className="sidebar-card">
        <h4 className="sidebar-subtitle">Performance</h4>
        <ul className="sidebar-metrics">
          <li>
            <span>Equity</span>
            <strong>{formatUSD(wallet.totalEquityUsd)}</strong>
          </li>
          <li>
            <span>24h Change</span>
            <strong className={wallet.change24hPct >= 0 ? 'positive' : 'negative'}>{formatSigned(wallet.change24hPct, '%')}</strong>
          </li>
          <li>
            <span>Realized PnL</span>
            <strong className={metrics.realizedPnlUsd >= 0 ? 'positive' : 'negative'}>{formatUSD(metrics.realizedPnlUsd)}</strong>
          </li>
          <li>
            <span>Win Rate</span>
            <strong>{formatSigned(metrics.winRatePct, '%')}</strong>
          </li>
          <li>
            <span>Profit Factor</span>
            <strong>{metrics.profitFactor.toFixed(2)}</strong>
          </li>
        </ul>
      </section>
    </aside>
  );
}
