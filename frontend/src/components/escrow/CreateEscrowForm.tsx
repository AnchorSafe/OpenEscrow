import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateEscrow } from '../../hooks/useEscrow'
import { useWallet } from '../../hooks/useWallet'
import { Spinner, ErrorAlert } from '../shared'

interface MilestoneInput {
  title: string
  amount: string
  deadline: string
}

const emptyMilestone = (): MilestoneInput => ({ title: '', amount: '', deadline: '' })

export function CreateEscrowForm() {
  const navigate = useNavigate()
  const { address } = useWallet()
  const create = useCreateEscrow()

  const [recipient, setRecipient] = useState('')
  const [mediator, setMediator] = useState('')
  const [currency, setCurrency] = useState<'XLM' | 'USDC'>('USDC')
  const [milestones, setMilestones] = useState<MilestoneInput[]>([emptyMilestone()])

  const updateMilestone = (i: number, field: keyof MilestoneInput, val: string) =>
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)))

  const addMilestone = () => setMilestones((prev) => [...prev, emptyMilestone()])
  const removeMilestone = (i: number) =>
    setMilestones((prev) => prev.filter((_, idx) => idx !== i))

  const totalXLM = milestones.reduce((sum, m) => {
    const stroops = parseInt(m.amount || '0', 10)
    return sum + stroops / 10_000_000
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return alert('Connect your wallet first')

    await create.mutateAsync({
      payer: address,
      recipient,
      mediator: mediator || address,
      currency,
      milestones: milestones.map((m) => ({
        title: m.title,
        amount: m.amount,
        deadline: m.deadline ? Math.floor(new Date(m.deadline).getTime() / 1000) : undefined,
      })),
    })

    navigate('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {create.error && (
        <ErrorAlert message={(create.error as Error).message} />
      )}

      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Parties</h2>

        <div>
          <label className="label">Payer (you)</label>
          <input className="input bg-gray-50" value={address || 'Connect wallet first'} readOnly />
        </div>

        <div>
          <label className="label">Recipient address</label>
          <input
            className="input"
            placeholder="G..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Mediator address <span className="text-gray-400">(optional — defaults to you)</span></label>
          <input
            className="input"
            placeholder="G... (leave blank to self-mediate)"
            value={mediator}
            onChange={(e) => setMediator(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Currency</label>
          <div className="flex gap-3">
            {(['XLM', 'USDC'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  currency === c
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Milestones</h2>
          <span className="text-sm text-gray-500">
            Total: {totalXLM.toLocaleString()} {currency}
          </span>
        </div>

        {milestones.map((m, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Milestone {i + 1}</span>
              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  placeholder="e.g. Design mockups"
                  value={m.title}
                  onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Amount (stroops)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 1000000000"
                  value={m.amount}
                  onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                  required
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="label">Deadline <span className="text-gray-400">(optional)</span></label>
              <input
                className="input"
                type="date"
                value={m.deadline}
                onChange={(e) => updateMilestone(i, 'deadline', e.target.value)}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addMilestone}
          className="btn-secondary w-full"
          disabled={milestones.length >= 20}
        >
          + Add Milestone
        </button>
      </div>

      <button type="submit" className="btn-primary w-full py-3" disabled={create.isPending}>
        {create.isPending ? <Spinner size="sm" /> : 'Create Escrow Agreement'}
      </button>
    </form>
  )
}
