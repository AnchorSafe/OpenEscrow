export type EscrowStatus =
  | 'created'
  | 'funded'
  | 'active'
  | 'disputed'
  | 'completed'
  | 'refunded'

export type MilestoneStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'released'
  | 'disputed'

export interface Milestone {
  index: number
  title: string
  amount: string        // in stroops as string (avoid JS bigint issues)
  deadline: number      // unix timestamp, 0 = none
  status: MilestoneStatus
}

export interface Escrow {
  id: string            // UUID — maps to a deployed contract instance
  contractId: string    // Soroban contract address
  payer: string         // Stellar public key
  recipient: string
  mediator: string
  token: string         // SAC address
  currency: 'XLM' | 'USDC'
  totalAmount: string
  releasedAmount: string
  milestones: Milestone[]
  status: EscrowStatus
  createdAt: string
  updatedAt: string
  disputeReason?: string
  txHashes: string[]    // all relevant transaction hashes
}

export interface CreateEscrowInput {
  payer: string
  recipient: string
  mediator: string
  currency: 'XLM' | 'USDC'
  milestones: Array<{
    title: string
    amount: string
    deadline?: number
  }>
}
