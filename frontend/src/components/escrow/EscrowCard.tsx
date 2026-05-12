import { Link } from 'react-router-dom'
import type { Escrow } from '../../types/escrow'
import { Badge, ProgressBar } from '../shared'
import { formatAmount, shortAddress, STATUS_COLORS } from '../../lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  escrow: Escrow
  currentAddress: string
}

export function EscrowCard({ escrow, currentAddress }: Props) {
  const role = escrow.payer === currentAddress ? 'Payer' : 'Recipient'
  const released = Number(BigInt(escrow.releasedAmount))
  const total = Number(BigInt(escrow.totalAmount))

  return (
    <Link
      to={`/escrows/${escrow.id}`}
      className="card p-5 block hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge label={escrow.status} className={STATUS_COLORS[escrow.status]} />
            <span className="text-xs text-gray-400">{role}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">
            {role === 'Payer' ? `→ ${shortAddress(escrow.recipient)}` : `← ${shortAddress(escrow.payer)}`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDistanceToNow(new Date(escrow.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-gray-900">
            {formatAmount(escrow.totalAmount, escrow.currency)}
          </p>
          <p className="text-xs text-gray-400">
            {escrow.milestones.length} milestone{escrow.milestones.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar value={released} max={total} />
        <p className="text-xs text-gray-400 mt-1">
          {formatAmount(escrow.releasedAmount, escrow.currency)} released
        </p>
      </div>
    </Link>
  )
}
