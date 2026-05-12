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
  amount: string
  deadline: number
  status: MilestoneStatus
}

export interface Escrow {
  id: string
  contractId: string
  payer: string
  recipient: string
  mediator: string
  token: string
  currency: 'XLM' | 'USDC'
  totalAmount: string
  releasedAmount: string
  milestones: Milestone[]
  status: EscrowStatus
  createdAt: string
  updatedAt: string
  disputeReason?: string
  txHashes: string[]
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
