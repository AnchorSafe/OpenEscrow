# OpenEscrow

**Open-source escrow and milestone payment infrastructure built on Stellar.**

Secure cross-border payments and milestone-based settlements for freelancers, remote teams, agencies, and global commerce — powered by Soroban smart contracts, XLM, and USDC.

---

## The Problem

Cross-border work is broken. Freelancers wait weeks for wire transfers. Clients have no guarantee of delivery. Banks charge 3–8% in fees. Disputes have no neutral resolution path. Billions of people are excluded from global commerce because they lack access to traditional financial infrastructure.

## Why Escrow Matters

Escrow solves the trust problem in commerce: funds are locked until agreed conditions are met. Neither party can run away. But traditional escrow is expensive, slow, and requires a trusted third party — usually a bank or legal entity.

**OpenEscrow replaces the bank with a smart contract.**

## Why Stellar

Stellar is purpose-built for global payments:

| Property | Stellar |
|---|---|
| Settlement time | 3–5 seconds |
| Transaction fee | ~0.00001 XLM ($0.000001) |
| Native stablecoin | USDC via Circle |
| Smart contracts | Soroban (Rust-based, WASM) |
| Financial inclusion | Designed for the unbanked |

Stellar's mission aligns directly with OpenEscrow's: low-cost, fast, accessible payments for everyone.

## How Milestone Payments Work

```
Payer                    Contract                 Recipient
  |                          |                        |
  |── create() ─────────────>|                        |
  |── fund() ───────────────>|  (funds locked)        |
  |                          |<── submit_milestone() ──|
  |── approve_milestone() ──>|── transfer() ─────────>|
  |                          |                        |
  |  (or raise_dispute())    |                        |
  |                          |<── resolve_dispute() ──| (mediator)
```

Example: $1,000 project
- Milestone 1 — Design mockups: $300 (30%)
- Milestone 2 — Development: $400 (40%)
- Milestone 3 — Final delivery: $300 (30%)

Each milestone is independently submitted, approved, and released on-chain.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Tailwind + Vite)    │
│  - Dashboard, Escrow Detail, Create Form            │
│  - React Query for data fetching                    │
│  - Zustand for wallet state                         │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│  Backend (Node.js + Express + TypeScript)           │
│  - Escrow CRUD, milestone lifecycle, disputes       │
│  - Stellar SDK — Soroban RPC invocations            │
│  - PostgreSQL — off-chain state mirror              │
└────────────────────┬────────────────────────────────┘
                     │ Soroban RPC
┌────────────────────▼────────────────────────────────┐
│  Soroban Smart Contract (Rust)                      │
│  - Trustless fund custody                           │
│  - Milestone state machine                          │
│  - Dispute resolution logic                         │
└─────────────────────────────────────────────────────┘
```

## Project Structure

```
OpenEscrow/
├── frontend/          React + TypeScript + Tailwind + Vite
├── backend/           Express + TypeScript + Stellar SDK
├── contracts/         Soroban smart contracts (Rust)
│   └── escrow/        Main escrow contract
├── scripts/           Deployment and utility scripts
├── docs/              Additional documentation
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+
- Rust + `wasm32-unknown-unknown` target
- Stellar CLI (`cargo install stellar-cli`)
- PostgreSQL 15+

### 1. Clone and install

```bash
git clone https://github.com/openescrow/openescrow.git
cd openescrow
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your Stellar keys and database URL
```

### 3. Set up the database

```bash
createdb openescrow
npm run db:migrate --workspace=backend
```

### 4. Build and deploy the contract

```bash
# Build
npm run contracts:build

# Deploy to testnet
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/openescrow_contract.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet

# Copy the contract ID into backend/.env as ESCROW_CONTRACT_ID
```

### 5. Run the app

```bash
npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:3001

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/escrows?address=G...` | List escrows for an address |
| `POST` | `/api/escrows` | Create a new escrow |
| `GET` | `/api/escrows/:id` | Get escrow details |
| `POST` | `/api/escrows/:id/fund` | Fund the escrow |
| `POST` | `/api/escrows/:id/milestones/:n/submit` | Recipient submits milestone |
| `POST` | `/api/escrows/:id/milestones/:n/approve` | Payer approves milestone |
| `POST` | `/api/escrows/:id/milestones/:n/dispute` | Payer raises dispute |
| `POST` | `/api/escrows/:id/milestones/:n/resolve` | Mediator resolves dispute |
| `POST` | `/api/escrows/:id/refund` | Payer cancels and refunds |
| `GET` | `/api/stellar/account/:address` | Get Stellar account balances |
| `GET` | `/api/stellar/tx/:hash` | Get transaction details |

## Smart Contract

The Soroban contract (`contracts/escrow/src/lib.rs`) implements:

- **`create()`** — initialise escrow with parties and milestones
- **`fund()`** — payer deposits total amount into contract
- **`submit_milestone(index)`** — recipient signals work complete
- **`approve_milestone(index)`** — payer releases milestone funds
- **`raise_dispute(index, reason)`** — payer disputes a milestone
- **`resolve_dispute(index, release_to_recipient)`** — mediator decides
- **`refund()`** — payer cancels, unreleased funds returned
- **`get()`** — read-only state view

Security properties:
- Only the payer can fund, approve, dispute, and refund
- Only the recipient can submit milestones
- Only the mediator can resolve disputes
- Total released amount can never exceed deposited amount
- No admin key — the contract is the only custodian

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).

## Roadmap

See [ROADMAP.md](./ROADMAP.md).
