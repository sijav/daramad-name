import type { Channel, Currency } from 'src/shared/types'

// Persian labels for the domain enums. Kept out of the type definitions so the
// data layer never depends on presentation.

export const CHANNEL_LABELS: Record<Channel, string> = {
  CARD_TO_CARD: 'کارت به کارت',
  REMITTANCE: 'حواله',
  TETHER: 'تتر',
  OTHER: 'دیگر',
}

export const CURRENCY_LABELS: Record<Currency, string> = {
  TOMAN: 'تومان',
  USD: 'دلار',
  USDT: 'تتر',
}

/** Short unit shown inside the amount field. */
export const CURRENCY_UNITS: Record<Currency, string> = {
  TOMAN: 'تومان',
  USD: 'دلار',
  USDT: 'تتر',
}
