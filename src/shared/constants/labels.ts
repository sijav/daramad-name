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
  CARD_TO_CARD: msg`کارت به کارت`,
  REMITTANCE: msg`حواله`,
  TETHER: msg`تتر`,
  OTHER: msg`دیگر`,
}

export const CURRENCY_LABELS: Record<Currency, MessageDescriptor> = {
  TOMAN: msg`تومان`,
  USD: msg`دلار`,
  USDT: msg`تتر`,
}

/** Month names, resolved at render time so they follow the active locale. */
export const JALALI_MONTH_LABELS: MessageDescriptor[] = [
  msg`فروردین`,
  msg`اردیبهشت`,
  msg`خرداد`,
  msg`تیر`,
  msg`مرداد`,
  msg`شهریور`,
  msg`مهر`,
  msg`آبان`,
  msg`آذر`,
  msg`دی`,
  msg`بهمن`,
  msg`اسفند`,
]

export const GREGORIAN_MONTH_LABELS: MessageDescriptor[] = [
  msg`ژانویه`,
  msg`فوریه`,
  msg`مارس`,
  msg`آوریل`,
  msg`مه`,
  msg`ژوئن`,
  msg`ژوئیه`,
  msg`اوت`,
  msg`سپتامبر`,
  msg`اکتبر`,
  msg`نوامبر`,
  msg`دسامبر`,
]
