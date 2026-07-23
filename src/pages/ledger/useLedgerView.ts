import { useMemo, useState } from 'react'
import { useSettings } from 'src/core/query'
import type { LedgerFilter, LedgerSort, LedgerSummary, ReceiptWithClient } from 'src/shared/types'
import { toEnglishDigits } from 'src/shared/utils'

const DEFAULT_PAGE_SIZE = 25

export interface LedgerPage {
  /** Rows for the current page. */
  rows: ReceiptWithClient[]
  /** Rows after search, before pagination, this is what the result count means. */
  matchedCount: number
  /** The query's summary re-stated over the searched rows, so it counts the same set. */
  summary: LedgerSummary
  page: number
  pageCount: number
}

/**
 * View state for the redesigned ledger: filters, free-text search, sorting and
 * pagination.
 *
 * The hook owns the state but does NOT take the ledger, because the query key
 * is built from `filter` and `sort`, passing the data in would require the
 * query to exist before the state that drives it. Instead the page calls
 * `paginate(rows, summary)` once the query resolves.
 *
 * Search runs client-side over the already-filtered rows: the data is local and
 * small, so a text index in IndexedDB would add machinery for no gain. The
 * summary goes through the same call because of that, the query computed it
 * before the search existed, so `paginate` is the only place that can bring the
 * two back into agreement.
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
      (rows: ReceiptWithClient[], summary: LedgerSummary): LedgerPage => {
        const term = toEnglishDigits(search).trim().toLowerCase()
        const searched = term ? rows.filter((receipt) => matches(receipt, term)) : rows

        const pageCount = Math.max(1, Math.ceil(searched.length / pageSize))
        // Clamped rather than stored, deleting the last row on page 4 must not
        // strand the user on an empty page.
        const safePage = Math.min(page, pageCount)

        return {
          rows: searched.slice((safePage - 1) * pageSize, safePage * pageSize),
          matchedCount: searched.length,
          summary: term ? summarise(searched, summary.monthsInRange) : summary,
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

/**
 * Re-states the summary over the searched rows.
 *
 * The query never sees the search term, so its total and count still describe
 * the rows the search has removed, leaving the ledger printing one receipt
 * count in the heading and another in the total band and the cards below it,
 * with the larger figure labelled as filtered. These numbers get copied onto a
 * document handed to an embassy, so they have to describe the same set.
 *
 * The divisor is kept: months come from the date range, and narrowing the text
 * does not shorten the period the income was earned over.
 */
const summarise = (rows: ReceiptWithClient[], monthsInRange: number): LedgerSummary => {
  const totalToman = rows.reduce((sum, row) => sum + row.amountToman, 0)
  return {
    totalToman,
    receiptCount: rows.length,
    monthlyAverageToman: Math.round(totalToman / monthsInRange),
    monthsInRange,
  }
}

/** Matches client name, note, and both the original and toman amounts. */
const matches = (receipt: ReceiptWithClient, term: string): boolean =>
  [receipt.clientName ?? '', receipt.note ?? '', String(receipt.amountToman), String(receipt.amountOriginal)].some((value) =>
    value.toLowerCase().includes(term),
  )
