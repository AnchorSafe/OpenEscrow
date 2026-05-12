import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  address: string
  setAddress: (address: string) => void
  clear: () => void
}

export const useWallet = create<WalletState>()(
  persist(
    (set) => ({
      address: '',
      setAddress: (address) => set({ address }),
      clear: () => set({ address: '' }),
    }),
    { name: 'openescrow-wallet' }
  )
)
