import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import escrowRoutes from './routes/escrow'
import stellarRoutes from './routes/stellar'
import { errorHandler } from './middleware/error'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }))
app.use(express.json())
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/escrows', escrowRoutes)
app.use('/api/stellar', stellarRoutes)

app.use(errorHandler)

const PORT = parseInt(process.env.PORT ?? '3001', 10)
app.listen(PORT, () => console.log(`OpenEscrow API listening on :${PORT}`))

export default app
