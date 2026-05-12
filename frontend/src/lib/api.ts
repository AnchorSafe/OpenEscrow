import axios from 'axios'
import type { Escrow, CreateEscrowInput } from '../types/escrow'

const api = axios.create({ baseURL: '/api' })

export const escrowApi = {
  list: (address: string) =>
    api.get<Escrow[]>('/escrows', { params: { address } }).then((r) => r.data),

  get: (id: string) =>
    api.get<Escrow>(`/escrows/${id}`).then((r) => r.data),

  create: (input: CreateEscrowInput) =>
    api.post<Escrow>('/escrows', input).then((r) => r.data),

  fund: (id: string, payerSecret: string) =>
    api.post<Escrow>(`/escrows/${id}/fund`, { payerSecret }).then((r) => r.data),

  submitMilestone: (id: string, index: number, recipientSecret: string) =>
    api.post<Escrow>(`/escrows/${id}/milestones/${index}/submit`, { recipientSecret }).then((r) => r.data),

  approveMilestone: (id: string, index: number, payerSecret: string) =>
    api.post<Escrow>(`/escrows/${id}/milestones/${index}/approve`, { payerSecret }).then((r) => r.data),

  raiseDispute: (id: string, index: number, reason: string, payerSecret: string) =>
    api.post<Escrow>(`/escrows/${id}/milestones/${index}/dispute`, { reason, payerSecret }).then((r) => r.data),

  resolveDispute: (id: string, index: number, releaseToRecipient: boolean, mediatorSecret: string) =>
    api.post<Escrow>(`/escrows/${id}/milestones/${index}/resolve`, { releaseToRecipient, mediatorSecret }).then((r) => r.data),

  refund: (id: string, payerSecret: string) =>
    api.post<Escrow>(`/escrows/${id}/refund`, { payerSecret }).then((r) => r.data),

  getAccount: (address: string) =>
    api.get(`/stellar/account/${address}`).then((r) => r.data),
}
