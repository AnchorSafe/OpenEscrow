import { z } from 'zod'

const stellarAddress = z.string().regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address')
const stroops = z.string().regex(/^\d+$/, 'Amount must be a positive integer string (stroops)')

export const createEscrowSchema = z.object({
  payer: stellarAddress,
  recipient: stellarAddress,
  mediator: stellarAddress,
  currency: z.enum(['XLM', 'USDC']),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1).max(100),
        amount: stroops,
        deadline: z.number().int().nonnegative().optional(),
      })
    )
    .min(1)
    .max(20),
})

export const fundEscrowSchema = z.object({
  payerSecret: z.string().min(56),
})

export const submitMilestoneSchema = z.object({
  recipientSecret: z.string().min(56),
})

export const approveMilestoneSchema = z.object({
  payerSecret: z.string().min(56),
})

export const raiseDisputeSchema = z.object({
  reason: z.string().min(1).max(500),
  payerSecret: z.string().min(56),
})

export const resolveDisputeSchema = z.object({
  releaseToRecipient: z.boolean(),
  mediatorSecret: z.string().min(56),
})

export const refundSchema = z.object({
  payerSecret: z.string().min(56),
})
