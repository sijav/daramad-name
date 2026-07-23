import { QueryClient } from '@tanstack/react-query'

// Every "request" is an IndexedDB read on the same machine, so the
// network-oriented defaults are all wrong:
//   · `retry: false`, because a failing IndexedDB read fails again identically
//     and retrying only delays the error the user needs to see.
//   · `staleTime: 0`, because a read costs microseconds and a stale total is
//     the one thing this app must not show.
//   · `refetchOnWindowFocus: false`, because only this app writes the data and
//     it invalidates explicitly when it does.
//   · `throwOnError: false`, because each surface renders its own error state
//     rather than unmounting the page into the boundary.
//   · `gcTime` is the library default, five minutes, and nothing here needs it
//     to be anything else.
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
