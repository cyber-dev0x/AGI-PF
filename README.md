# AGI PF

AGI PF is a full monitoring and control interface for **Milly**, an autonomous Solana meme-coin trading agent.

The platform is built for visibility and operator control:
- what Milly buys and sells,
- why each decision happened,
- how wallet equity changes,
- how risk posture shifts over time.

## Core Experience

- **Dashboard**: 3D runtime core, live equity curve, recent trades, thought stream.
- **Transactions**: searchable execution ledger with rationale, confidence, and Solscan links.
- **Portfolio**: live holdings, allocation donut, position PnL, risk envelope.
- **Documentation**: full architecture and operating model for Milly and AGI PF.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **React 19**
- **Framer Motion** (UI transitions)
- **Recharts** (financial charts)
- **React Three Fiber + Drei + Three.js** (3D runtime simulation)

## Runtime Model

The app runs in **live data mode**:
- real token prices and 24h change from CoinGecko,
- on-chain wallet balances and signatures from Solana RPC,
- unknown SPL token quote fallback from DexScreener,
- live confidence/mood/risk recomputation from fetched telemetry,
- continuous equity and position refresh.

## Operator Controls

From the right-side runtime panel:
- `Pause/Resume Runtime`
- `Force Sync`
- `Rebalance Risk`
- `Export CSV`
- `Reset Demo`

All controls are wired and functional.

## Project Structure

```text
app/
  page.tsx                  # Dashboard
  transactions/page.tsx     # Execution log
  portfolio/page.tsx        # Holdings and risk
  docs/page.tsx             # Product documentation
  layout.tsx                # Shell + provider + nav
  globals.css               # Design system and UI styles

components/
  runtime/MillyRuntimeProvider.tsx
  visuals/NeuralCoreScene.tsx
  charts/EquityChart.tsx
  charts/AllocationDonut.tsx
  layout/Navbar.tsx
  layout/Sidebar.tsx
  branding/BrandMark.tsx

lib/
  runtime-engine.ts         # Autonomous state transitions
  mock-data.ts              # Seed data + token universe
  types.ts                  # Domain types
  utils.ts                  # Formatting and helpers
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Production Build

```bash
npm run lint
npm run build
npm run start
```

## Live Integration Upgrade Path

To connect AGI PF to live execution:
1. Connect wallet signing adapter.
2. Replace simulation price updates with live feed adapters.
3. Connect Solana RPC and DEX routing layer.
4. Persist transactions and snapshots to a database.
5. Add policy engine + alerting for hard safety constraints.

## Notes

- This repository is intended as a high-fidelity product baseline with complete UX flows and transparent runtime behavior.
- For public deployment, add environment-based adapter wiring and production observability.
