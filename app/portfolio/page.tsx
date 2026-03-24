'use client';

import dynamic from 'next/dynamic';
import { useMillyRuntime } from '@/components/runtime/MillyRuntimeProvider';
import { formatAmount, formatPrice, formatSigned, formatUSD, shortAddress } from '@/lib/utils';

const AllocationDonut = dynamic(() => import('@/components/charts/AllocationDonut').then((mod) => mod.AllocationDonut), {
  ssr: false,
  loading: () => <div className="scene-loading">Loading allocation chart...</div>,
});

const EquityChart = dynamic(() => import('@/components/charts/EquityChart').then((mod) => mod.EquityChart), {
  ssr: false,
  loading: () => <div className="scene-loading">Loading chart...</div>,
});

export default function PortfolioPage() {
  const { wallet, metrics, positions, equitySeries, prices } = useMillyRuntime();

  const totalPositionValue = positions.reduce((sum, position) => sum + position.valueUsd, 0);

  return (
    <>
      <section className="panel panel-pad">
        <h1 className="panel-title">Portfolio Overview</h1>
        <p className="panel-subtitle">
          Real-time holdings, exposure distribution, and risk posture for Milly&apos;s autonomous Solana portfolio.
        </p>

        <div className="kpi-grid" style={{ marginTop: 14 }}>
          <article className="kpi-card">
            <span className="kpi-label">Total Equity</span>
            <div className="kpi-value">{formatUSD(wallet.totalEquityUsd)}</div>
            <div className="kpi-trend">{formatSigned(wallet.change24hPct, '%')} / 24h</div>
          </article>

          <article className="kpi-card">
            <span className="kpi-label">Position Value</span>
            <div className="kpi-value">{formatUSD(totalPositionValue)}</div>
            <div className="kpi-trend">{positions.length} open positions</div>
          </article>

          <article className="kpi-card">
            <span className="kpi-label">Stable Reserve</span>
            <div className="kpi-value">{formatUSD(wallet.usdcBalance)}</div>
            <div className="kpi-trend">USDC buffer</div>
          </article>

          <article className="kpi-card">
            <span className="kpi-label">SOL Reserve</span>
            <div className="kpi-value">{wallet.solBalance.toFixed(2)} SOL</div>
            <div className="kpi-trend">{formatPrice(prices.SOL)} spot</div>
          </article>
        </div>
      </section>

      <section className="grid-2">
        <article className="panel panel-pad">
          <h2 className="panel-title">Allocation</h2>
          <p className="panel-subtitle">Position sizing by current USD value.</p>
          <AllocationDonut positions={positions} />
        </article>

        <article className="panel panel-pad">
          <h2 className="panel-title">Balance Growth</h2>
          <p className="panel-subtitle">Composite equity across liquid reserves and open exposure.</p>
          <EquityChart data={equitySeries.slice(-160)} />
        </article>
      </section>

      <section className="panel panel-pad">
        <h2 className="panel-title">Open Positions</h2>
        <p className="panel-subtitle">Mark-to-market values with 24h delta reference and address mapping.</p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Amount</th>
                <th>Ref Price (24h)</th>
                <th>Current</th>
                <th>Value</th>
                <th>24h Delta</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {[...positions]
                .sort((a, b) => b.valueUsd - a.valueUsd)
                .map((position) => (
                  <tr key={position.address}>
                    <td>
                      <strong>{position.symbol}</strong>
                      <div className="feed-time">{position.name}</div>
                    </td>
                    <td className="mono">{formatAmount(position.amount)}</td>
                    <td className="mono">{formatPrice(position.avgEntryUsd)}</td>
                    <td className="mono">{formatPrice(position.currentPriceUsd)}</td>
                    <td className="mono">{formatUSD(position.valueUsd)}</td>
                    <td className={position.unrealizedPnlUsd >= 0 ? 'positive mono' : 'negative mono'}>
                      {formatUSD(position.unrealizedPnlUsd)}
                      <div>{formatSigned(position.unrealizedPnlPct, '%')}</div>
                    </td>
                    <td className="mono">{shortAddress(position.address)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel-pad">
        <h2 className="panel-title">Risk Envelope</h2>
        <p className="panel-subtitle">Derived metrics used by Milly runtime to gate position aggressiveness.</p>

        <div className="kpi-grid" style={{ marginTop: 12 }}>
          <article className="kpi-card">
            <span className="kpi-label">Win Rate</span>
            <div className="kpi-value">{formatSigned(metrics.winRatePct, '%')}</div>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">Profit Factor</span>
            <div className="kpi-value">{metrics.profitFactor.toFixed(2)}</div>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">Sharpe-Like</span>
            <div className="kpi-value">{metrics.sharpeLike.toFixed(2)}</div>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">Max Drawdown</span>
            <div className="kpi-value">{formatSigned(metrics.maxDrawdownPct, '%')}</div>
          </article>
        </div>
      </section>
    </>
  );
}
