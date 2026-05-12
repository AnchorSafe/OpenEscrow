import { Router, Request, Response, NextFunction } from 'express'
import {
  createEscrowSchema,
  fundEscrowSchema,
  submitMilestoneSchema,
  approveMilestoneSchema,
  raiseDisputeSchema,
  resolveDisputeSchema,
  refundSchema,
} from '../middleware/validate'
import * as svc from '../services/escrow'

const router = Router()

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next)

// GET /api/escrows?address=G...
router.get(
  '/',
  wrap(async (req, res) => {
    const { address } = req.query
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'address query param required' })
    }
    const escrows = await svc.listEscrowsByAddress(address)
    res.json(escrows)
  })
)

// POST /api/escrows
router.post(
  '/',
  wrap(async (req, res) => {
    const input = createEscrowSchema.parse(req.body)
    const escrow = await svc.createEscrow(input)
    res.status(201).json(escrow)
  })
)

// GET /api/escrows/:id
router.get(
  '/:id',
  wrap(async (req, res) => {
    const escrow = await svc.getEscrowById(req.params.id)
    if (!escrow) return res.status(404).json({ error: 'Escrow not found' })
    res.json(escrow)
  })
)

// POST /api/escrows/:id/fund
router.post(
  '/:id/fund',
  wrap(async (req, res) => {
    const { payerSecret } = fundEscrowSchema.parse(req.body)
    const escrow = await svc.fundEscrow(req.params.id, payerSecret)
    res.json(escrow)
  })
)

// POST /api/escrows/:id/milestones/:index/submit
router.post(
  '/:id/milestones/:index/submit',
  wrap(async (req, res) => {
    const { recipientSecret } = submitMilestoneSchema.parse(req.body)
    const escrow = await svc.submitMilestone(
      req.params.id,
      parseInt(req.params.index, 10),
      recipientSecret
    )
    res.json(escrow)
  })
)

// POST /api/escrows/:id/milestones/:index/approve
router.post(
  '/:id/milestones/:index/approve',
  wrap(async (req, res) => {
    const { payerSecret } = approveMilestoneSchema.parse(req.body)
    const escrow = await svc.approveMilestone(
      req.params.id,
      parseInt(req.params.index, 10),
      payerSecret
    )
    res.json(escrow)
  })
)

// POST /api/escrows/:id/milestones/:index/dispute
router.post(
  '/:id/milestones/:index/dispute',
  wrap(async (req, res) => {
    const { reason, payerSecret } = raiseDisputeSchema.parse(req.body)
    const escrow = await svc.raiseDispute(
      req.params.id,
      parseInt(req.params.index, 10),
      reason,
      payerSecret
    )
    res.json(escrow)
  })
)

// POST /api/escrows/:id/milestones/:index/resolve
router.post(
  '/:id/milestones/:index/resolve',
  wrap(async (req, res) => {
    const { releaseToRecipient, mediatorSecret } = resolveDisputeSchema.parse(req.body)
    const escrow = await svc.resolveDispute(
      req.params.id,
      parseInt(req.params.index, 10),
      releaseToRecipient,
      mediatorSecret
    )
    res.json(escrow)
  })
)

// POST /api/escrows/:id/refund
router.post(
  '/:id/refund',
  wrap(async (req, res) => {
    const { payerSecret } = refundSchema.parse(req.body)
    const escrow = await svc.refundEscrow(req.params.id, payerSecret)
    res.json(escrow)
  })
)

export default router
