import { Link } from 'react-router-dom'

const STEPS = [
  { n: '01', title: 'Create Agreement', desc: 'Define parties, milestones, and amounts in seconds.' },
  { n: '02', title: 'Fund Escrow', desc: 'Payer deposits funds into a Soroban smart contract on Stellar.' },
  { n: '03', title: 'Track Milestones', desc: 'Recipient submits work; payer approves each stage.' },
  { n: '04', title: 'Release Funds', desc: 'Approved milestones trigger instant on-chain transfers.' },
]

const FEATURES = [
  { icon: '⚡', title: 'Near-instant settlement', desc: '3–5 second finality on Stellar.' },
  { icon: '🌍', title: 'Cross-border ready', desc: 'XLM and USDC — no bank required.' },
  { icon: '🔒', title: 'Trustless contracts', desc: 'Soroban smart contracts hold funds, not us.' },
  { icon: '💸', title: 'Micro-fees', desc: 'Stellar fees are fractions of a cent.' },
]

export function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="text-center py-16">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span>⬡</span> Built on Stellar
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Global escrow for<br />remote work & commerce
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Secure milestone payments between anyone, anywhere — powered by Stellar smart contracts.
          No banks. No middlemen. Near-zero fees.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/escrows/new" className="btn-primary px-6 py-3 text-base">
            Create Escrow
          </Link>
          <Link to="/dashboard" className="btn-secondary px-6 py-3 text-base">
            View Dashboard
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-5">
              <span className="text-3xl font-bold text-brand-100">{s.n}</span>
              <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Stellar</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5 text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card p-10 text-center bg-brand-600 border-0">
        <h2 className="text-2xl font-bold text-white mb-3">Open source & free to use</h2>
        <p className="text-brand-100 mb-6">
          Deploy your own instance or contribute on GitHub.
        </p>
        <a
          href="https://github.com/openescrow/openescrow"
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 text-base"
        >
          View on GitHub
        </a>
      </section>
    </div>
  )
}
