'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { SOLSCAN_ROOT } from '@/lib/mock-data';
import { useMillyRuntime } from '@/components/runtime/MillyRuntimeProvider';
import { formatAmount, formatPrice, formatUSD, shortSignature, timeAgo } from '@/lib/utils';

export default function TransactionsPage() {
  const { transactions } = useMillyRuntime();
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const byAction = action === 'ALL' ? true : tx.action === action;
      const searchTarget = `${tx.symbol} ${tx.tokenName} ${tx.strategy} ${tx.signature}`.toLowerCase();
      const byQuery = query.trim().length === 0 ? true : searchTarget.includes(query.toLowerCase());
      return byAction && byQuery;
    });
  }, [transactions, query, action]);

  return (
    <>
      <section className="panel panel-pad">
        <h1 className="panel-title">Transaction Log</h1>
        <p className="panel-subtitle">
          Full autonomous execution history with rationale, realized PnL, confidence score, and direct Solscan links.
        </p>

        <div className="filters">
          <label style={{ position: 'relative', minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#78936f' }} />
            <input
              className="filter-input"
              style={{ paddingLeft: 31, width: '100%' }}
              placeholder="Search token, strategy, signature"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <select className="filter-select" value={action} onChange={(event) => setAction(event.target.value as 'ALL' | 'BUY' | 'SELL')}>
            <option value="ALL">All Actions</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
        </div>
      </section>

      <section className="panel panel-pad">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Token</th>
                <th>Amount</th>
                <th>Price</th>
                <th>Value</th>
                <th>PnL</th>
                <th>Confidence</th>
                <th>Reason</th>
                <th>Signature</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id}>
                  <td className="mono">{timeAgo(tx.timestamp)}</td>
                  <td>
                    <span className={`table-inline-chip ${tx.action === 'BUY' ? 'buy' : 'sell'}`}>{tx.action}</span>
                  </td>
                  <td>
                    <strong>{tx.symbol}</strong>
                    <div className="feed-time">{tx.tokenName}</div>
                  </td>
                  <td className="mono">{formatAmount(tx.amount)}</td>
                  <td className="mono">{formatPrice(tx.priceUsd)}</td>
                  <td className="mono">{formatUSD(tx.valueUsd)}</td>
                  <td className={tx.realizedPnlUsd === null ? 'mono' : tx.realizedPnlUsd >= 0 ? 'positive mono' : 'negative mono'}>
                    {tx.realizedPnlUsd === null ? 'Open' : formatUSD(tx.realizedPnlUsd)}
                  </td>
                  <td>{tx.confidence}%</td>
                  <td style={{ maxWidth: 280 }}>
                    <span className="feed-text">{tx.strategy}</span>
                  </td>
                  <td>
                    <a
                      className="mono"
                      href={`${SOLSCAN_ROOT}/tx/${tx.signature}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#d9ffaf' }}
                    >
                      {shortSignature(tx.signature)}
                      <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
