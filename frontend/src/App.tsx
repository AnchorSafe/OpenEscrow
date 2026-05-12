import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navbar } from './components/shared/Navbar'
import { HomePage } from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { NewEscrowPage } from './pages/NewEscrowPage'
import { EscrowDetailPage } from './pages/EscrowDetailPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/escrows/new" element={<NewEscrowPage />} />
              <Route path="/escrows/:id" element={<EscrowDetailPage />} />
            </Routes>
          </main>
          <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
            OpenEscrow — open-source escrow on Stellar ·{' '}
            <a href="https://github.com/openescrow/openescrow" className="hover:text-gray-600">
              GitHub
            </a>
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
