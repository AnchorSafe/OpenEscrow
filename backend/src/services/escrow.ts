import { Keypair, xdr } from '@stellar/stellar-sdk'
import {
  invokeContract,
  tokenAddress,
  toScAddress,
  toScI128,
  toScU32,
  toScBool,
} from './stellar'
import {
  insertEscrow,
  getEscrowById,
  getEscrowByContractId,
  listEscrowsByAddress,
  updateEscrowStatus,
  updateMilestoneStatus,
} from '../db/queries'
import type { CreateEscrowInput, Escrow } from '../types/escrow'

const CONTRACT_ID = process.env.ESCROW_CONTRACT_ID!
const PLATFORM_KEYPAIR = Keypair.fromSecret(process.env.PLATFORM_SECRET_KEY!)

// ── Create ────────────────────────────────────────────────────────────────────

export async function createEscrow(input: CreateEscrowInput): Promise<Escrow> {
  const token = tokenAddress(input.currency)
  const totalAmount = input.milestones
    .reduce((sum, m) => sum + BigInt(m.amount), 0n)
    .toString()

  // Build milestone Vec<Milestone> as ScVal
  const milestonesScVal = buildMilestonesScVal(input.milestones)

  const { txHash } = await invokeContract(
    CONTRACT_ID,
    'create',
    [
      toScAddress(input.payer),
      toScAddress(input.recipient),
      toScAddress(input.mediator),
      toScAddress(token),
      milestonesScVal,
    ],
    PLATFORM_KEYPAIR
  )

  const escrow = await insertEscrow({
    contractId: CONTRACT_ID,
    payer: input.payer,
    recipient: input.recipient,
    mediator: input.mediator,
    token,
    currency: input.currency,
    totalAmount,
    milestones: input.milestones.map((m) => ({
      title: m.title,
      amount: m.amount,
      deadline: m.deadline ?? 0,
    })),
  })

  await updateEscrowStatus(escrow.id, 'created', { txHash })
  return getEscrowById(escrow.id) as Promise<Escrow>
}

// ── Fund ──────────────────────────────────────────────────────────────────────

export async function fundEscrow(escrowId: string, payerSecret: string): Promise<Escrow> {
  const escrow = await getEscrowById(escrowId)
  if (!escrow) throw new Error('Escrow not found')
  if (escrow.status !== 'created') throw new Error('Escrow already funded or closed')

  const payerKeypair = Keypair.fromSecret(payerSecret)
  const { txHash } = await invokeContract(escrow.contractId, 'fund', [], payerKeypair)

  await updateEscrowStatus(escrow.id, 'active', { txHash })
  return getEscrowById(escrow.id) as Promise<Escrow>
}

// ── Submit milestone ──────────────────────────────────────────────────────────

export async function submitMilestone(
  escrowId: string,
  milestoneIndex: number,
  recipientSecret: string
): Promise<Escrow> {
  const escrow = await getEscrowById(escrowId)
  if (!escrow) throw new Error('Escrow not found')
  if (escrow.status !== 'active') throw new Error('Escrow not active')

  const recipientKeypair = Keypair.fromSecret(recipientSecret)
  const { txHash } = await invokeContract(
    escrow.contractId,
    'submit_milestone',
    [toScU32(milestoneIndex)],
    recipientKeypair
  )

  await updateMilestoneStatus(escrow.id, milestoneIndex, 'submitted')
  await updateEscrowStatus(escrow.id, 'active', { txHash })
  return getEscrowById(escrow.id) as Promise<Escrow>
}

// ── Approve milestone ─────────────────────────────────────────────────────────

export async function approveMilestone(
  escrowId: string,
  milestoneIndex: number,
  payerSecret: string
): Promise<Escrow> {
  const escrow = await getEscrowById(escrowId)
  if (!escrow) throw new Error('Escrow not found')
  if (escrow.status !== 'active') throw new Error('Escrow not active')

  const milestone = escrow.milestones[milestoneIndex]
  if (!milestone) throw new Error('Invalid milestone index')
  if (milestone.status !== 'submitted') throw new Error('Milestone not submitted')

  const payerKeypair = Keypair.fromSecret(payerSecret)
  const { txHash } = await invokeContract(
    escrow.contractId,
    'approve_milestone',
    [toScU32(milestoneIndex)],
    payerKeypair
  )

  const newReleased = (BigInt(escrow.releasedAmount) + BigInt(milestone.amount)).toString()
  await updateMilestoneStatus(escrow.id, milestoneIndex, 'released')

  const allReleased = escrow.milestones.every(
    (m, i) => i === milestoneIndex || m.status === 'released'
  )
  const newStatus = allReleased ? 'completed' : 'active'
  await updateEscrowStatus(escrow.id, newStatus, { releasedAmount: newReleased, txHash })

  return getEscrowById(escrow.id) as Promise<Escrow>
}

// ── Raise dispute ─────────────────────────────────────────────────────────────

export async function raiseDispute(
  escrowId: string,
  milestoneIndex: number,
  reason: string,
  payerSecret: string
): Promise<Escrow> {
  const escrow = await getEscrowById(escrowId)
  if (!escrow) throw new Error('Escrow not found')
  if (escrow.status !== 'active') throw new Error('Escrow not active')

  const payerKeypair = Keypair.fromSecret(payerSecret)
  const { txHash } = await invokeContract(
    escrow.contractId,
    'raise_dispute',
    [toScU32(milestoneIndex), xdr.ScVal.scvString(Buffer.from(reason))],
    payerKeypair
  )

  await updateMilestoneStatus(escrow.id, milestoneIndex, 'disputed')
  await updateEscrowStatus(escrow.id, 'disputed', { disputeReason: reason, txHash })
  return getEscrowById(escrow.id) as Promise<Escrow>
}

// ── Resolve dispute ───────────────────────────────────────────────────────────

export async function resolveDispute(
  escrowId: string,
  milestoneIndex: number,
  releaseToRecipient: boolean,
  mediatorSecret: string
): Promise<Escrow> {
  const escrow = await getEscrowById(escrowId)
  if (!escrow) throw new Error('Escrow not found')
  if (escrow.status !== 'disputed') throw new Error('Escrow not in disputed state')

  const mediatorKeypair = Keypair.fromSecret(mediatorSecret)
  const { txHash } = await invokeContract(
    escrow.contractId,
    'resolve_dispute',
    [toScU32(milestoneIndex), toScBool(releaseToRecipient)],
    mediatorKeypair
  )

  const milestone = escrow.milestones[milestoneIndex]
  const newMilestoneStatus = releaseToRecipient ? 'released' : 'pending'
  await updateMilestoneStatus(escrow.id, milestoneIndex, newMilestoneStatus)

  let newReleased = escrow.releasedAmount
  if (releaseToRecipient && milestone) {
    newReleased = (BigInt(escrow.releasedAmount) + BigInt(milestone.amount)).toString()
  }

  const stillDisputed = escrow.milestones.some(
    (m, i) => i !== milestoneIndex && m.status === 'disputed'
  )
  const allDone = escrow.milestones.every(
    (m, i) => i === milestoneIndex ? newMilestoneStatus === 'released' : m.status === 'released'
  )
  const newStatus = stillDisputed ? 'disputed' : allDone ? 'completed' : 'active'

  await updateEscrowStatus(escrow.id, newStatus, { releasedAmount: newReleased, txHash })
  return getEscrowById(escrow.id) as Promise<Escrow>
}

// ── Refund ────────────────────────────────────────────────────────────────────

export async function refundEscrow(escrowId: string, payerSecret: string): Promise<Escrow> {
  const escrow = await getEscrowById(escrowId)
  if (!escrow) throw new Error('Escrow not found')
  if (!['created', 'active'].includes(escrow.status)) {
    throw new Error('Cannot refund in current state')
  }

  const payerKeypair = Keypair.fromSecret(payerSecret)
  const { txHash } = await invokeContract(escrow.contractId, 'refund', [], payerKeypair)

  await updateEscrowStatus(escrow.id, 'refunded', { txHash })
  return getEscrowById(escrow.id) as Promise<Escrow>
}

// ── Read ──────────────────────────────────────────────────────────────────────

export { getEscrowById, getEscrowByContractId, listEscrowsByAddress }

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMilestonesScVal(
  milestones: Array<{ title: string; amount: string; deadline?: number }>
): xdr.ScVal {
  const items = milestones.map((m) =>
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('title'),
        val: xdr.ScVal.scvString(Buffer.from(m.title)),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('amount'),
        val: toScI128(BigInt(m.amount)),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('deadline'),
        val: xdr.ScVal.scvU64(xdr.Uint64.fromString(String(m.deadline ?? 0))),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('status'),
        val: xdr.ScVal.scvVoid(), // contract sets initial status
      }),
    ])
  )
  return xdr.ScVal.scvVec(items)
}
