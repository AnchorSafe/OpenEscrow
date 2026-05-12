import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EscrowStatus, MilestoneStatus } from '../types/escrow'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert stroops string to human-readable XLM/USDC */
export function formatAmount(stroops: string, currency: 'XLM' | 'USDC'): string {
  const n = Number(BigInt(stroops)) / 10_000_000
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 })} ${currency}`
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function explorerUrl(txHash: string, network = 'testnet'): string {
  return `https://stellar.expert/explorer/${network}/tx/${txHash}`
}

export const STATUS_COLORS: Record<EscrowStatus, string> = {
  created: 'bg-gray-100 text-gray-700',
  funded: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-700',
  completed: 'bg-emerald-100 text-emerald-700',
  refunded: 'bg-yellow-100 text-yellow-700',
}

export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-indigo-100 text-indigo-700',
  released: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-700',
}
