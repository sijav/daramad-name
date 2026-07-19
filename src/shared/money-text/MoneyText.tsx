import { useLingui } from '@lingui/react/macro'
import { Typography, type TypographyProps } from '@mui/material'
import { CURRENCY_LABELS } from 'src/shared/constants'
import type { Currency } from 'src/shared/types'
import { formatAmount } from 'src/shared/utils'

export interface MoneyTextProps extends Omit<TypographyProps, 'children'> {
  value: number
  /** Omit for toman; pass a currency to render the original amount instead. */
  currency?: Currency
  /** Appends the currency name. */
  showUnit?: boolean
}

/**
 * The single component that renders money, so Persian digits, three-digit
 * grouping and the unit label can never drift between the ledger, the charts
 * and the cards.
 *
 * Uses tabular figures: without them the toman column in the ledger visibly
 * jitters between rows, which looks careless in a financial tool.
 */
export const MoneyText = ({ value, currency = 'TOMAN', showUnit = true, sx, ...props }: MoneyTextProps) => {
  const { i18n } = useLingui()
  const amount = formatAmount(value, currency)
  const text = showUnit ? `${amount} ${i18n._(CURRENCY_LABELS[currency])}` : amount

  return (
    <Typography
      component="span"
      dir="rtl"
      sx={[{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    >
      {text}
    </Typography>
  )
}
