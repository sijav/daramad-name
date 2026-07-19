import { useMemo, useState } from 'react'
import { useSettings } from 'src/core/query'
import type { LedgerFilter, LedgerSort, ReceiptWithClient } from 'src/shared/types'
import { toEnglishDigits } from 'src/shared/utils'

const DEFAULT_PAGE_SIZE = 25

export interface LedgerPage {
  /** Rows for the current page. */
  rows: ReceiptWithClient[]
  /** Rows after search, before pagination — this is what the result count means. */
  matchedCount: number
  page: number
  pageCount: number
}

/**
 * View state for the redesigned ledger: filters, free-text search, sorting and
 * pagination.
 *
 * The hook owns the state but does NOT take the ledger, because the query key
 * is built from `filter` and `sort` — passing the data in would require the
 * query to exist before the state that drives it. Instead the page calls
 * `paginate(rows)` once the query resolves.
 *
 * Search runs client-side over the already-filtered rows: the data is local and
 * small, so a text index in IndexedDB would add machinery for no gain.
 */
export const useLedgerView = () => {
  const { calendar } = useSettings()
  const [filter, setFilterState] = useState<LedgerFilter>({})
  const [sort, setSort] = useState<LedgerSort>({ field: 'occurredAt', direction: 'desc' })
  const [search, setSearchState] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE)

  const activeFilterCount = [filter.range, filter.clientId, filter.channel].filter(Boolean).length

  const paginate = useMemo(
    () =>
      (rows: ReceiptWithClient[]): LedgerPage => {
        const term = toEnglishDigits(search).trim().toLowerCase()
        const searched = term ? rows.filter((receipt) => matches(receipt, term)) : rows

        const pageCount = Math.max(1, Math.ceil(searched.length / pageSize))
        // Clamped rather than stored — deleting the last row on page 4 must not
        // strand the user on an empty page.
        const safePage = Math.min(page, pageCount)

        return {
          rows: searched.slice((safePage - 1) * pageSize, safePage * pageSize),
          matchedCount: searched.length,
          page: safePage,
          pageCount,
        }
      },
    [search, page, pageSize],
  )

  return {
    calendar,
    filter,
    sort,
    search,
    pageSize,
    activeFilterCount,
    paginate,
    setSort,
    // Any change to what is being shown resets to page 1; staying on page 4 of
    // a freshly filtered list shows an empty table.
    setFilter: (next: LedgerFilter) => {
      setFilterState(next)
      setPage(1)
    },
    setSearch: (next: string) => {
      setSearchState(next)
      setPage(1)
    },
    setPageSize: (next: number) => {
      setPageSizeState(next)
      setPage(1)
    },
    setPage,
    clearAll: () => {
      setFilterState({})
      setSearchState('')
      setPage(1)
    },
  }
}

/** Matches client name, note, and both the original and toman amounts. */
const matches = (receipt: ReceiptWithClient, term: string): boolean =>
  [receipt.clientName ?? '', receipt.note ?? '', String(receipt.amountToman), String(receipt.amountOriginal)].some((value) =>
    value.toLowerCase().includes(term),
  )
