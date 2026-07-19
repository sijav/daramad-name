import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { Channel, Currency } from 'src/shared/types'

// Labels for the domain enums.
//
// These are module-level constants, so they cannot call the `t` macro (there is
// no i18n context at module-evaluation time and the strings would be frozen at
// the locale active on first import). `msg` produces a lazy descriptor instead,
// which callers resolve with `i18n._(descriptor)` at render time.

export const CHANNEL_LABELS: Record<Channel, MessageDescriptor> = {
  CARD_TO_CARD: msg`Card to card`,
  REMITTANCE: msg`Wire transfer`,
  TETHER: msg`Tether`,
  OTHER: msg`Other`,
}

export const CURRENCY_LABELS: Record<Currency, MessageDescriptor> = {
  TOMAN: msg`Toman`,
  USD: msg`USD`,
  USDT: msg`Tether`,
}

/** Month names, resolved at render time so they follow the active locale. */
export const JALALI_MONTH_LABELS: MessageDescriptor[] = [
  msg`Farvardin`,
  msg`Ordibehesht`,
  msg`Khordad`,
  msg`Tir`,
  msg`Mordad`,
  msg`Shahrivar`,
  msg`Mehr`,
  msg`Aban`,
  msg`Azar`,
  msg`Dey`,
  msg`Bahman`,
  msg`Esfand`,
]

export const GREGORIAN_MONTH_LABELS: MessageDescriptor[] = [
  msg`January`,
  msg`February`,
  msg`March`,
  msg`April`,
  msg`May`,
  msg`June`,
  msg`July`,
  msg`August`,
  msg`September`,
  msg`October`,
  msg`November`,
  msg`December`,
]
