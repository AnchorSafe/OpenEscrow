import { CreateEscrowForm } from '../components/escrow/CreateEscrowForm'

export function NewEscrowPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Create Escrow Agreement</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Define parties, milestones, and amounts. Funds are locked on-chain until milestones are approved.
        </p>
      </div>
      <CreateEscrowForm />
    </div>
  )
}
