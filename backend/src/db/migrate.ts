import { pool } from './pool'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS escrows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     TEXT NOT NULL UNIQUE,
  payer           TEXT NOT NULL,
  recipient       TEXT NOT NULL,
  mediator        TEXT NOT NULL,
  token           TEXT NOT NULL,
  currency        TEXT NOT NULL CHECK (currency IN ('XLM', 'USDC')),
  total_amount    TEXT NOT NULL,
  released_amount TEXT NOT NULL DEFAULT '0',
  status          TEXT NOT NULL DEFAULT 'created',
  dispute_reason  TEXT,
  tx_hashes       TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
  id          SERIAL PRIMARY KEY,
  escrow_id   UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  idx         INTEGER NOT NULL,
  title       TEXT NOT NULL,
  amount      TEXT NOT NULL,
  deadline    BIGINT NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'pending',
  UNIQUE (escrow_id, idx)
);

CREATE INDEX IF NOT EXISTS idx_escrows_payer     ON escrows(payer);
CREATE INDEX IF NOT EXISTS idx_escrows_recipient ON escrows(recipient);
CREATE INDEX IF NOT EXISTS idx_escrows_status    ON escrows(status);
`

export async function migrate() {
  await pool.query(SCHEMA)
  console.log('Database migrated')
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(console.error)
}
