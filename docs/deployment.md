# Deployment Guide

## Local Development

### Prerequisites

- Node.js 20+
- Rust + `wasm32-unknown-unknown` target
- Stellar CLI: `cargo install stellar-cli`
- PostgreSQL 15+ (or Docker)

### 1. Install dependencies

```bash
git clone https://github.com/openescrow/openescrow.git
cd openescrow
npm install
```

### 2. Generate test accounts

```bash
node scripts/setup-testnet.js
```

This generates keypairs and funds them via Friendbot. Copy the `PLATFORM_SECRET_KEY` output into `backend/.env`.

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Fill in PLATFORM_SECRET_KEY and DATABASE_URL
```

### 4. Start PostgreSQL

```bash
# With Docker:
docker run -d -p 5432:5432 \
  -e POSTGRES_DB=openescrow \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16-alpine

# Or use your local PostgreSQL:
createdb openescrow
```

### 5. Run migrations

```bash
npm run db:migrate --workspace=backend
```

### 6. Build and deploy the contract

```bash
# Build
npm run contracts:build

# Deploy to testnet
node scripts/deploy-contracts.js --network testnet
# This writes ESCROW_CONTRACT_ID to backend/.env automatically
```

### 7. Start the app

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## Docker Compose (recommended for staging)

```bash
cp backend/.env.example backend/.env
# Fill in PLATFORM_SECRET_KEY and ESCROW_CONTRACT_ID

docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## Production Deployment

### Contract

Deploy to mainnet:

```bash
node scripts/deploy-contracts.js --network mainnet
```

Set `STELLAR_NETWORK=mainnet` and `STELLAR_HORIZON_URL=https://horizon.stellar.org` in your environment.

### Backend

Any Node.js host works (Railway, Render, Fly.io, EC2):

```bash
npm run build --workspace=backend
node backend/dist/index.js
```

Required environment variables:
- `DATABASE_URL` — PostgreSQL connection string
- `PLATFORM_SECRET_KEY` — Stellar keypair for contract invocations
- `ESCROW_CONTRACT_ID` — deployed contract address
- `STELLAR_NETWORK=mainnet`
- `JWT_SECRET` — random 32+ char string

### Frontend

Build and serve as static files:

```bash
npm run build --workspace=frontend
# Deploy frontend/dist/ to Vercel, Netlify, S3+CloudFront, etc.
```

Set `VITE_API_URL` if your API is on a different domain.

---

## Security Checklist

- [ ] `PLATFORM_SECRET_KEY` is stored in a secrets manager, not in `.env` files in production
- [ ] PostgreSQL is not publicly accessible
- [ ] HTTPS is enforced (TLS termination at load balancer or nginx)
- [ ] `CORS_ORIGIN` is set to your frontend domain only
- [ ] Rate limiting is configured appropriately for your traffic
- [ ] Contract has been reviewed before mainnet deployment
