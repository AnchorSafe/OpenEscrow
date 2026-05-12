import { Router } from 'express'
import { getAccountBalances, getTransactionDetails } from '../services/stellar'

const router = Router()

// GET /api/stellar/account/:address
router.get('/account/:address', async (req, res, next) => {
  try {
    const balances = await getAccountBalances(req.params.address)
    res.json({ address: req.params.address, balances })
  } catch (err) {
    next(err)
  }
})

// GET /api/stellar/tx/:hash
router.get('/tx/:hash', async (req, res, next) => {
  try {
    const tx = await getTransactionDetails(req.params.hash)
    res.json(tx)
  } catch (err) {
    next(err)
  }
})

export default router
