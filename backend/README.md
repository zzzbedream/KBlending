# KBlending Backend

Event indexer + REST API for the KBlending lending market on KUB Chain. Reads the vault's live state and indexes its events to expose protocol analytics — including the **Weekly Unique Active Wallet** metric the grant tracks — for the dashboard and reviewers.

## Stack

TypeScript · Fastify · ethers v6 · Vitest. In-memory store behind a `Repository` interface (swap for Postgres later without touching services or routes).

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness + indexer status (events indexed, last block). |
| GET | `/api/market` | Live market snapshot: TVL, borrows, utilization, borrow/supply APR, LTV. |
| GET | `/api/position/:address` | A wallet's supplied / debt / collateral / health factor. |
| GET | `/api/stats/wuaw` | Weekly Unique Active Wallet, per ISO week (from indexed events). |
| GET | `/api/stats/summary` | Total events, unique wallets, per-event-type counts. |
| GET | `/api/events?limit=N` | Most recent indexed events. |
| GET | `/api/liquidatable` | Known borrowers whose Health Factor is below 1.0. |

## Run

```bash
cd backend
npm install
cp .env.example .env      # set RPC_URL, VAULT_ADDRESS, COLLATERAL/BORROW_ADDRESS, START_BLOCK
npm run dev               # http://localhost:4000
```

Without `VAULT_ADDRESS` the API still serves; the indexer stays idle and chain endpoints return `503` until you configure it.

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest (stats/WUAW logic)
npm run build       # tsc -> dist/
npm start           # node dist/main.js
```

## How the indexer works

On start it back-fills from `START_BLOCK` to the chain head in `LOG_CHUNK_SIZE` block windows, parsing the vault's user events (`Supplied`, `Borrowed`, `Repaid`, `Liquidated`, …), then polls every `POLL_INTERVAL_MS`. Events are deduped by `txHash:logIndex`. The `Weekly Unique Active Wallet` figure is derived purely from these on-chain events, so it is auditable end-to-end.
