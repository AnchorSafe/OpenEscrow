import { useParams } from 'react-router-dom'
import { useEscrow, useFundEscrow, useRefundEscrow } from '../hooks/useEscrow'
import { useWallet } from '../hooks/useWallet'
import { MilestoneList } from '../components/escrow/MilestoneList'
import { Badge, ProgressBar, Spinner, ErrorAlert } from '../components/shared'
import { formatAmount, shortAddress, STATUS_COLORS, explorerUrl } from '../lib/utils'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

export function EscrowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { address } = useWallet()
  const { data: escrow, isLoading, error } = useEscrow(id!)
  const fund = useFundEscrow(id!)
  const refund = useRefundEscrow(id!)

  const [payerSecret, setPayerSecret] = useState('')

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (error || !escrow) return <ErrorAlert message="Escrow not found" />

  const isPayer = escrow.payer === address
  const released = Number(BigInt(escrow.releasedAmount))
  const total = Number(BigInt(escrow.totalAmount))
  const pct = total > 0 ? Math.round((released / total) * 100) : 0

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge label={escrow.status} className={STATUS_COLORS[escrow.status]} />
              <span className="text-xs text-gray-400">
                Created {formatDistanceToNow(new Date(escrow.createdAt), { addSuffix: true })}
              </span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              {formatAmount(escrow.totalAmount, escrow.currency)} Escrow
            </h1>
          </div>
          <div className="text-right text-sm">
            <p className="text-gray-500">Contract</p>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${escrow.contractId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-brand-600 hover:underline"
            >
              {shortAddress(escrow.contractId)}
            </a>
          </div>
        </div>

        {/* Progress */}
        <ProgressBar value={released} max={total} />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatAmount(escrow.releasedAmount, escrow.currency)} released</span>
          <span>{pct}%</span>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          {[
            { label: 'Payer', address: escrow.payer },
            { label: 'Recipient', address: escrow.recipient },
            { label: 'Mediator', address: escrow.mediator },
          ].map(({ label, address: addr }) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-xs font-mono text-gray-700 truncate">{shortAddress(addr)}</p>
            </div>
          ))}
        </div>

        {/* Dispute reason */}
        {escrow.disputeReason && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs font-medium text-red-700">Dispute: {escrow.disputeReason}</p>
          </div>
        )}
      </div>

      {/* Fund action */}
      {isPayer && escrow.status === 'created' && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Fund Escrow</h2>
          <p className="text-sm text-gray-500 mb-4">
            Deposit {formatAmount(escrow.totalAmount, escrow.currency)} into the smart contract to activate the agreement.
          </p>
          <div className="flex gap-3">
            <input
              type="password"
              placeholder="Your secret key"
              className="input flex-1"
              value={payerSecret}
              onChange={(e) => setPayerSecret(e.target.value)}
            />
            <button
              className="btn-primary"
              disabled={fund.isPending || !payerSecret}
              onClick={() => fund.mutate(payerSecret)}
            >
              {fund.isPending ? <Spinner size="sm" /> : 'Fund'}
            </button>
          </div>
          {fund.error && <ErrorAlert message={(fund.error as Error).message} />}
        </div>
      )}

      {/* Refund action */}
      {isPayer && ['created', 'active'].includes(escrow.status) && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Cancel & Refund</h2>
          <div className="flex gap-3">
            <input
              type="password"
              placeholder="Your secret key"
              className="input flex-1"
              value={payerSecret}
              onChange={(e) => setPayerSecret(e.target.value)}
            />
            <button
              className="btn-danger"
              disabled={refund.isPending || !payerSecret}
              onClick={() => refund.mutate(payerSecret)}
            >
              {refund.isPending ? <Spinner size="sm" /> : 'Refund'}
            </button>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Milestones</h2>
        <MilestoneList escrow={escrow} currentAddress={address} />
      </div>

      {/* Share link */}
      <div className="card p-4 flex items-center justify-between">
        <p className="text-xs text-gray-500">Public agreement link</p>
        <button
          className="text-xs text-brand-600 hover:underline"
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          Copy link
        </button>
      </div>
    </div>
  )
}
