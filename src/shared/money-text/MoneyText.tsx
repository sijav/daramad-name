import { useLingui } from '@lingui/react/macro'
import { Typography, type TypographyProps } from '@mui/material'
import { CURRENCY_LABELS } from 'src/shared/constants'
import { useFormat } from 'src/shared/format'
import type { Currency } from 'src/shared/types'

export interface MoneyTextProps extends Omit<TypographyProps, 'children'> {
  value: number
  currency?: Currency
  showUnit?: boolean
}

/**
 * The single component that renders money, so digits, grouping and the unit
 * label can never drift between the ledger, the charts and the cards.
 *
 * Uses tabular figures: without them the toman column in the ledger visibly
 * jitters between rows, which looks careless in a financial tool.
 */
export const MoneyText = ({ value, currency = 'TOMAN', showUnit = true, sx, ...props }: MoneyTextProps) => {
  const { i18n } = useLingui()
  const { amount, persian } = useFormat()
  const formatted = amount(value, currency)
  const text = showUnit ? `${formatted} ${i18n._(CURRENCY_LABELS[currency])}` : formatted

  return (
    <Typography
      component="span"
      dir={persian ? 'rtl' : 'ltr'}
      sx={[{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    >
      {text}
    </Typography>
  )
}
