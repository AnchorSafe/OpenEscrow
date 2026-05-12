import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../../hooks/useWallet'
import { shortAddress } from '../../lib/utils'

export function Navbar() {
  const { address, setAddress, clear } = useWallet()
  const location = useLocation()

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        location.pathname === to
          ? 'text-brand-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <span className="text-brand-600 text-lg">⬡</span>
            OpenEscrow
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            {navLink('/dashboard', 'Dashboard')}
            {navLink('/escrows/new', 'New Escrow')}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {address ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                {shortAddress(address)}
              </span>
              <button onClick={clear} className="text-xs text-gray-500 hover:text-gray-700">
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="btn-primary text-xs"
              onClick={() => {
                const addr = prompt('Enter your Stellar public key (G...)')
                if (addr?.startsWith('G')) setAddress(addr)
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
