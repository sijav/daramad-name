import { useLingui } from '@lingui/react/macro'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import { Box, CircularProgress, Skeleton, Stack } from '@mui/material'
import { EmptyState } from 'src/shared/empty-state'

export type LedgerStateKind = 'loading' | 'empty' | 'no-results' | 'error'

export interface LedgerStateProps {
  kind: LedgerStateKind
  onAction?: () => void
  errorMessage?: string
}

/**
 * The four ledger states from the design, in one component so they cannot drift
 * apart in wording or spacing.
 *
 * `empty` and `no-results` are deliberately different: "you have not recorded
 * anything" and "your filter matched nothing" call for opposite next actions,
 * and collapsing them into one message sends the user to the wrong place.
 */
export const LedgerState = ({ kind, onAction, errorMessage }: LedgerStateProps) => {
  const { t } = useLingui()

  if (kind === 'loading') {
    return (
      <Stack spacing={1} sx={{ py: 2 }} aria-busy="true" aria-live="polite">
        <Box sx={{ display: 'grid', placeItems: 'center', pb: 2 }}>
          {/* `CircularProgress` renders `role="progressbar"` with nothing inside
              it, so it needs a name of its own (axe `aria-progressbar-name`), 
              the `aria-busy` region around it is not one. */}
          <CircularProgress size={28} aria-label={t`Loading the ledger`} />
        </Box>
        {Array.from({ length: 6 }).map((_unused, index) => (
          <Skeleton key={index} variant="rounded" height={52} />
        ))}
      </Stack>
    )
  }

  if (kind === 'no-results') {
    return (
      <EmptyState
        icon={<SearchOffRoundedIcon />}
        title={t`Nothing matched these filters`}
        description={t`Change the date range or client, or clear the filters to see every receipt.`}
        actionLabel={onAction ? t`Clear filters` : undefined}
        onAction={onAction}
      />
    )
  }

  if (kind === 'error') {
    return (
      <EmptyState
        icon={<ErrorOutlineRoundedIcon />}
        title={t`The ledger could not be loaded`}
        description={errorMessage ?? t`Your data is safe and has not been erased. Try again.`}
        actionLabel={onAction ? t`Try again` : undefined}
        onAction={onAction}
      />
    )
  }

  return (
    <EmptyState
      icon={<ReceiptLongRoundedIcon />}
      title={t`You have not recorded any receipts yet`}
      description={t`The ledger is where every payment you have received adds up in one place — exactly what you need when it is time to produce a report.`}
      actionLabel={onAction ? t`Record your first receipt` : undefined}
      onAction={onAction}
    />
  )
}
