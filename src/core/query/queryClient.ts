import { QueryClient } from '@tanstack/react-query'

// Every "request" is an IndexedDB read on the same machine, so the usual
// network-oriented defaults are wrong here:
//   · retry is off, a failing IndexedDB read will fail again identically, and
//     retrying just delays showing the user a real error.
//   · staleTime is 0, reads are microseconds, and stale financial totals are
//     worse than a refetch.
//   · refetchOnWindowFocus is off, nothing can change the data from another
//     tab mid-session except this app, which invalidates explicitly.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      throwOnError: false,
    },
    mutations: {
      retry: false,
    },
  },
})

/**
 * Query keys touched by any receipt write. Every receipt mutation invalidates
 * this whole set, because a single receipt moves the ledger, the totals, the
 * charts, the client list and the report at once.
 */
export const RECEIPT_DEPENDENT_KEYS = ['ledger', 'clients', 'monthly-totals', 'client-shares', 'income-report', 'populated-years'] as const

export const invalidateReceiptQueries = async (): Promise<void> => {
  await Promise.all(RECEIPT_DEPENDENT_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}
