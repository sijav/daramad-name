import { Typography, type TypographyProps } from '@mui/material'
import type { Currency } from 'src/shared/types'
import { formatAmount, formatToman } from 'src/shared/utils'

export interface MoneyTextProps extends Omit<TypographyProps, 'children'> {
  value: number
  /** Omit for toman; pass a currency to render the original amount instead. */
  currency?: Currency
  /** Appends «تومان». On by default for toman values. */
  showUnit?: boolean
}

/**
 * The single component that renders money, so Persian digits and three-digit
 * grouping can never drift between the ledger, the charts and the cards.
 *
 * Uses tabular figures: without them the toman column in the ledger visibly
 * jitters between rows, which looks careless in a financial tool.
 */
export const MoneyText = ({ value, currency = 'TOMAN', showUnit = true, sx, ...props }: MoneyTextProps) => {
  const text = currency === 'TOMAN' && showUnit ? formatToman(value) : formatAmount(value, currency)

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
