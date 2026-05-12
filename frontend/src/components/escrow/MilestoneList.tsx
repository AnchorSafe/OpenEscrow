import { useState } from 'react'
import type { Escrow, Milestone } from '../../types/escrow'
import { Badge, Spinner } from '../shared'
import { formatAmount, MILESTONE_STATUS_COLORS, explorerUrl } from '../../lib/utils'
import {
  useSubmitMilestone,
  useApproveMilestone,
  useRaiseDispute,
  useResolveDispute,
} from '../../hooks/useEscrow'

interface Props {
  escrow: Escrow
  currentAddress: string
}

export function MilestoneList({ escrow, currentAddress }: Props) {
  const isPayer = escrow.payer === currentAddress
  const isRecipient = escrow.recipient === currentAddress
  const isMediator = escrow.mediator === currentAddress

  const submit = useSubmitMilestone(escrow.id)
  const approve = useApproveMilestone(escrow.id)
  const dispute = useRaiseDispute(escrow.id)
  const resolve = useResolveDispute(escrow.id)

  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({})
  const [disputeReasons, setDisputeReasons] = useState<Record<number, string>>({})

  const secret = (key: string) => secretInputs[key] ?? ''
  const setSecret = (key: string, val: string) =>
    setSecretInputs((prev) => ({ ...prev, [key]: val }))

  return (
    <div className="space-y-3">
      {escrow.milestones.map((m: Milestone) => (
        <div key={m.index} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {m.index + 1}. {m.title}
                </span>
                <Badge label={m.status} className={MILESTONE_STATUS_COLORS[m.status]} />
              </div>
              <p className="text-sm text-gray-500">
                {formatAmount(m.amount, escrow.currency)}
              </p>
              {m.deadline > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Due {new Date(m.deadline * 1000).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 items-end min-w-[200px]">
              {/* Recipient: submit */}
              {isRecipient && m.status === 'pending' && escrow.status === 'active' && (
                <div className="flex gap-2 items-center w-full">
                  <input
                    type="password"
                    placeholder="Your secret key"
                    className="input text-xs flex-1"
                    value={secret(`submit-${m.index}`)}
                    onChange={(e) => setSecret(`submit-${m.index}`, e.target.value)}
                  />
                  <button
                    className="btn-primary text-xs whitespace-nowrap"
                    disabled={submit.isPending}
                    onClick={() =>
                      submit.mutate({ index: m.index, recipientSecret: secret(`submit-${m.index}`) })
                    }
                  >
                    {submit.isPending ? <Spinner size="sm" /> : 'Submit'}
                  </button>
                </div>
              )}

              {/* Payer: approve or dispute */}
              {isPayer && m.status === 'submitted' && escrow.status === 'active' && (
                <div className="space-y-2 w-full">
                  <input
                    type="password"
                    placeholder="Your secret key"
                    className="input text-xs"
                    value={secret(`payer-${m.index}`)}
                    onChange={(e) => setSecret(`payer-${m.index}`, e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn-primary text-xs flex-1"
                      disabled={approve.isPending}
                      onClick={() =>
                        approve.mutate({ index: m.index, payerSecret: secret(`payer-${m.index}`) })
                      }
                    >
                      {approve.isPending ? <Spinner size="sm" /> : 'Approve'}
                    </button>
                    <button
                      className="btn-danger text-xs flex-1"
                      disabled={dispute.isPending}
                      onClick={() => {
                        const reason = disputeReasons[m.index] ?? ''
                        if (!reason) return alert('Enter a dispute reason')
                        dispute.mutate({ index: m.index, reason, payerSecret: secret(`payer-${m.index}`) })
                      }}
                    >
                      Dispute
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Dispute reason (if disputing)"
                    className="input text-xs"
                    value={disputeReasons[m.index] ?? ''}
                    onChange={(e) =>
                      setDisputeReasons((prev) => ({ ...prev, [m.index]: e.target.value }))
                    }
                  />
                </div>
              )}

              {/* Mediator: resolve */}
              {isMediator && m.status === 'disputed' && (
                <div className="space-y-2 w-full">
                  <input
                    type="password"
                    placeholder="Mediator secret key"
                    className="input text-xs"
                    value={secret(`mediator-${m.index}`)}
                    onChange={(e) => setSecret(`mediator-${m.index}`, e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn-primary text-xs flex-1"
                      disabled={resolve.isPending}
                      onClick={() =>
                        resolve.mutate({
                          index: m.index,
                          releaseToRecipient: true,
                          mediatorSecret: secret(`mediator-${m.index}`),
                        })
                      }
                    >
                      Release
                    </button>
                    <button
                      className="btn-secondary text-xs flex-1"
                      disabled={resolve.isPending}
                      onClick={() =>
                        resolve.mutate({
                          index: m.index,
                          releaseToRecipient: false,
                          mediatorSecret: secret(`mediator-${m.index}`),
                        })
                      }
                    >
                      Refund
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Transaction history */}
      {escrow.txHashes.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Transaction History
          </h4>
          <div className="space-y-1">
            {escrow.txHashes.map((hash) => (
              <a
                key={hash}
                href={explorerUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs font-mono text-brand-600 hover:underline truncate"
              >
                {hash}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
