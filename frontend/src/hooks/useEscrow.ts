import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { escrowApi } from '../lib/api'
import type { CreateEscrowInput } from '../types/escrow'

export function useEscrows(address: string) {
  return useQuery({
    queryKey: ['escrows', address],
    queryFn: () => escrowApi.list(address),
    enabled: !!address,
  })
}

export function useEscrow(id: string) {
  return useQuery({
    queryKey: ['escrow', id],
    queryFn: () => escrowApi.get(id),
    enabled: !!id,
    refetchInterval: 10_000, // poll for on-chain updates
  })
}

export function useCreateEscrow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEscrowInput) => escrowApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escrows'] }),
  })
}

export function useFundEscrow(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payerSecret: string) => escrowApi.fund(id, payerSecret),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escrow', id] }),
  })
}

export function useSubmitMilestone(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ index, recipientSecret }: { index: number; recipientSecret: string }) =>
      escrowApi.submitMilestone(id, index, recipientSecret),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escrow', id] }),
  })
}

export function useApproveMilestone(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ index, payerSecret }: { index: number; payerSecret: string }) =>
      escrowApi.approveMilestone(id, index, payerSecret),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escrow', id] }),
  })
}

export function useRaiseDispute(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      index,
      reason,
      payerSecret,
    }: {
      index: number
      reason: string
      payerSecret: string
    }) => escrowApi.raiseDispute(id, index, reason, payerSecret),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escrow', id] }),
  })
}

export function useResolveDispute(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      index,
      releaseToRecipient,
      mediatorSecret,
    }: {
      index: number
      releaseToRecipient: boolean
      mediatorSecret: string
    }) => escrowApi.resolveDispute(id, index, releaseToRecipient, mediatorSecret),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escrow', id] }),
  })
}

export function useRefundEscrow(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payerSecret: string) => escrowApi.refund(id, payerSecret),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escrow', id] }),
  })
}
