'use client';

import { useMillyRuntime } from '@/components/runtime/MillyRuntimeProvider';
import { formatSigned, formatUSD, shortAddress } from '@/lib/utils';

export default function DocsPage() {
  const { wallet, metrics, mood, confidence, riskLevel } = useMillyRuntime();

  return (
    <div className="docs">
      <section>
        <h2>AGI PF Documentation</h2>
        <p>
          AGI PF is an execution intelligence platform designed to monitor <strong>Milly</strong>, an autonomous Solana
          trading agent focused on high-volatility meme assets. The platform tracks transaction flow, strategy
          rationale, portfolio growth, and risk shifts through a single operator interface.
        </p>
        <p>
          Current runtime state: wallet <code>{shortAddress(wallet.publicKey)}</code>, confidence <code>{confidence}%</code>,
          risk level <code>{riskLevel}</code>, mood <code>{mood}</code>, total equity <code>{formatUSD(wallet.totalEquityUsd)}</code>.
        </p>
      </section>

      <section>
        <h3>How Milly Became AGI</h3>
        <ol>
          <li>
            Milly started as a narrow execution bot with static entry and exit thresholds on Solana DEX pairs.
          </li>
          <li>
            It evolved into an adaptive decision system by combining price-action, order-flow, and social-velocity
            features.
          </li>
          <li>
            A confidence-weighted planner was added to shift aggression dynamically and allocate capital across tokens.
          </li>
          <li>
            A memory layer recorded strategy outcomes and updated risk posture, turning Milly from a scripted bot into a
            continuously self-tuning trading agent.
          </li>
          <li>
            AGI PF was built as the transparency layer so every decision, transaction, and balance shift can be audited.
          </li>
        </ol>
      </section>

      <section>
        <h3>Architecture</h3>
        <div className="code-block">
{`Signal Layer          -> On-chain activity, market microstructure, narrative velocity
Decision Layer        -> Confidence model + mood state + strategy selector
Execution Layer       -> Position sizing, order routing, transaction writing
Risk Layer            -> Drawdown gates, reserve controls, rebalance triggers
Observability Layer   -> AGI PF dashboards, docs, exports, and audit log`}        </div>
        <p>
          In this build, the runtime ships in autonomous demo mode with deterministic market simulation and full control
          flow. The same state model is designed to attach live adapters (RPC, DEX, and wallet signers) without changing
          the user-facing interface.
        </p>
      </section>

      <section>
        <h3>Execution Cycle</h3>
        <ol>
          <li>Ingest market and wallet state.</li>
          <li>Update token prices and position marks.</li>
          <li>Estimate opportunity score and confidence.</li>
          <li>Select action: buy, sell, hold, or rebalance.</li>
          <li>Write transaction record with strategy rationale.</li>
          <li>Recompute equity, drawdown, and risk status.</li>
          <li>Emit thought stream event for operator traceability.</li>
        </ol>
      </section>

      <section>
        <h3>Risk Controls</h3>
        <ul>
          <li>Position-level sizing bounds tied to available USDC reserve.</li>
          <li>Autonomous sell pressure when reserve liquidity drops below configured thresholds.</li>
          <li>Rebalance mode to cut oversized exposure and reset risk budget.</li>
          <li>Continuous drawdown monitoring with dynamic aggression reduction.</li>
          <li>Exportable transaction history for external compliance and accounting checks.</li>
        </ul>
        <p>
          Live metrics now: win rate <code>{formatSigned(metrics.winRatePct, '%')}</code>, realized PnL{' '}
          <code>{formatUSD(metrics.realizedPnlUsd)}</code>, max drawdown <code>{formatSigned(metrics.maxDrawdownPct, '%')}</code>.
        </p>
      </section>

      <section>
        <h3>Operator Guide</h3>
        <ol>
          <li>Use <strong>Pause Runtime</strong> to freeze autonomous ticks.</li>
          <li>Use <strong>Force Trade</strong> to immediately execute one additional strategy step.</li>
          <li>Use <strong>Rebalance Risk</strong> to reduce concentrated exposure.</li>
          <li>Use <strong>Export CSV</strong> to download a full transaction ledger.</li>
          <li>Use <strong>Reset Demo</strong> to restart from initial capital and positions.</li>
        </ol>
      </section>

      <section>
        <h3>Data Surfaces in AGI PF</h3>
        <ul>
          <li><strong>Dashboard</strong>: live equity, thought stream, and latest trade actions.</li>
          <li><strong>Transactions</strong>: full execution log with signatures and rationale.</li>
          <li><strong>Portfolio</strong>: allocation, open positions, and risk envelope.</li>
          <li><strong>Documentation</strong>: architecture, controls, and model behavior reference.</li>
        </ul>
      </section>

      <section>
        <h3>Upgrade Path to Live Execution</h3>
        <ol>
          <li>Attach signed wallet adapter for transaction broadcasting.</li>
          <li>Connect live Solana RPC + DEX routing adapters.</li>
          <li>Replace simulation price feed with real market streams.</li>
          <li>Introduce persistence (PostgreSQL + append-only audit events).</li>
          <li>Deploy alerting and policy engine for hard safety constraints.</li>
        </ol>
      </section>
    </div>
  );
}
