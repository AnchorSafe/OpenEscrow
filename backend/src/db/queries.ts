import { pool } from './pool'
import type { Escrow, Milestone } from '../types/escrow'

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToEscrow(row: Record<string, unknown>, milestones: Milestone[]): Escrow {
  return {
    id: row.id as string,
    contractId: row.contract_id as string,
    payer: row.payer as string,
    recipient: row.recipient as string,
    mediator: row.mediator as string,
    token: row.token as string,
    currency: row.currency as 'XLM' | 'USDC',
    totalAmount: row.total_amount as string,
    releasedAmount: row.released_amount as string,
    milestones,
    status: row.status as Escrow['status'],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    disputeReason: row.dispute_reason as string | undefined,
    txHashes: row.tx_hashes as string[],
  }
}

function rowToMilestone(row: Record<string, unknown>): Milestone {
  return {
    index: row.idx as number,
    title: row.title as string,
    amount: row.amount as string,
    deadline: row.deadline as number,
    status: row.status as Milestone['status'],
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function insertEscrow(data: {
  contractId: string
  payer: string
  recipient: string
  mediator: string
  token: string
  currency: string
  totalAmount: string
  milestones: Array<{ title: string; amount: string; deadline: number }>
}): Promise<Escrow> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO escrows (contract_id, payer, recipient, mediator, token, currency, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.contractId, data.payer, data.recipient, data.mediator, data.token, data.currency, data.totalAmount]
    )
    const escrowRow = rows[0]

    const milestones: Milestone[] = []
    for (let i = 0; i < data.milestones.length; i++) {
      const m = data.milestones[i]
      const { rows: mRows } = await client.query(
        `INSERT INTO milestones (escrow_id, idx, title, amount, deadline)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [escrowRow.id, i, m.title, m.amount, m.deadline ?? 0]
      )
      milestones.push(rowToMilestone(mRows[0]))
    }

    await client.query('COMMIT')
    return rowToEscrow(escrowRow, milestones)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getEscrowById(id: string): Promise<Escrow | null> {
  const { rows } = await pool.query('SELECT * FROM escrows WHERE id=$1', [id])
  if (!rows.length) return null
  const milestones = await getMilestones(id)
  return rowToEscrow(rows[0], milestones)
}

export async function getEscrowByContractId(contractId: string): Promise<Escrow | null> {
  const { rows } = await pool.query('SELECT * FROM escrows WHERE contract_id=$1', [contractId])
  if (!rows.length) return null
  const milestones = await getMilestones(rows[0].id)
  return rowToEscrow(rows[0], milestones)
}

export async function listEscrowsByAddress(address: string): Promise<Escrow[]> {
  const { rows } = await pool.query(
    'SELECT * FROM escrows WHERE payer=$1 OR recipient=$1 ORDER BY created_at DESC',
    [address]
  )
  return Promise.all(rows.map(async (row) => {
    const milestones = await getMilestones(row.id)
    return rowToEscrow(row, milestones)
  }))
}

export async function updateEscrowStatus(
  id: string,
  status: string,
  extra: { releasedAmount?: string; disputeReason?: string; txHash?: string } = {}
): Promise<void> {
  const updates: string[] = ['status=$2', 'updated_at=NOW()']
  const values: unknown[] = [id, status]
  let idx = 3

  if (extra.releasedAmount !== undefined) {
    updates.push(`released_amount=$${idx++}`)
    values.push(extra.releasedAmount)
  }
  if (extra.disputeReason !== undefined) {
    updates.push(`dispute_reason=$${idx++}`)
    values.push(extra.disputeReason)
  }
  if (extra.txHash) {
    updates.push(`tx_hashes=array_append(tx_hashes,$${idx++})`)
    values.push(extra.txHash)
  }

  await pool.query(
    `UPDATE escrows SET ${updates.join(',')} WHERE id=$1`,
    values
  )
}

export async function updateMilestoneStatus(
  escrowId: string,
  milestoneIndex: number,
  status: string
): Promise<void> {
  await pool.query(
    'UPDATE milestones SET status=$1 WHERE escrow_id=$2 AND idx=$3',
    [status, escrowId, milestoneIndex]
  )
}

async function getMilestones(escrowId: string): Promise<Milestone[]> {
  const { rows } = await pool.query(
    'SELECT * FROM milestones WHERE escrow_id=$1 ORDER BY idx',
    [escrowId]
  )
  return rows.map(rowToMilestone)
}
