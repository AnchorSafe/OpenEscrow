import { Link } from 'react-router-dom'
import { useEscrows } from '../hooks/useEscrow'
import { useWallet } from '../hooks/useWallet'
import { EscrowCard } from '../components/escrow/EscrowCard'
import { Spinner, EmptyState, ErrorAlert } from '../components/shared'

export function DashboardPage() {
  const { address } = useWallet()
  const { data: escrows, isLoading, error } = useEscrows(address)

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect your wallet</h2>
        <p className="text-gray-500 text-sm mb-6">
          Enter your Stellar public key to view your escrows.
        </p>
        <button
          className="btn-primary"
          onClick={() => {
            const addr = prompt('Enter your Stellar public key (G...)')
            if (addr?.startsWith('G')) useWallet.getState().setAddress(addr)
          }}
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your active and past escrow agreements</p>
        </div>
        <Link to="/escrows/new" className="btn-primary">
          New Escrow
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && <ErrorAlert message={(error as Error).message} />}

      {escrows && escrows.length === 0 && (
        <EmptyState message="No escrows yet. Create your first agreement." />
      )}

      {escrows && escrows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {escrows.map((e) => (
            <EscrowCard key={e.id} escrow={e} currentAddress={address} />
          ))}
        </div>
      )}
    </div>
  )
}
