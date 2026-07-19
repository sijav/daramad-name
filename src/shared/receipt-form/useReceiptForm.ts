import { useLingui } from '@lingui/react/macro'
import { useMemo, useState } from 'react'
import type { Channel, Currency, ReceiptWithClient } from 'src/shared/types'
import { computeToman, isToday } from 'src/shared/utils'

export interface ReceiptFormState {
  occurredAt: string
  amountOriginal: number | null
  currency: Currency
  rate: number | null
  clientName: string
  channel: Channel
  note: string
}

export interface ReceiptFormErrors {
  amountOriginal?: string
  rate?: string
}

const emptyState = (): ReceiptFormState => ({
  // Smart defaults for the 15-second path: today's date, toman, card-to-card.
  occurredAt: new Date().toISOString(),
  amountOriginal: null,
  currency: 'TOMAN',
  rate: null,
  clientName: '',
  channel: 'CARD_TO_CARD',
  note: '',
})

const fromReceipt = (receipt: ReceiptWithClient): ReceiptFormState => ({
  occurredAt: receipt.occurredAt,
  amountOriginal: receipt.amountOriginal,
  currency: receipt.currency,
  rate: receipt.rate,
  clientName: receipt.clientName ?? '',
  channel: receipt.channel,
  note: receipt.note ?? '',
})

/**
 * Form state for recording and editing a receipt.
 *
 * Also the home of the backdating rule. Scenario 1 asks for "today's rate";
 * scenario 5 records a receipt from two months ago. Combined naively those
 * produce a receipt valued at today's Tether price but dated to Mordad — and
 * because the toman value is frozen on save, that error becomes permanent and
 * silently wrong in every total, chart and PDF thereafter.
 *
 * So the form tracks whether the date is today and tells the UI to relabel and
 * warn. It cannot know the historical rate (there is no rate API by design),
 * but it can stop the user from assuming the default is right.
 */
export const useReceiptForm = (initial?: ReceiptWithClient) => {
  const { t } = useLingui()
  const [state, setState] = useState<ReceiptFormState>(() => (initial ? fromReceipt(initial) : emptyState()))
  const [submitted, setSubmitted] = useState(false)

  const patch = <K extends keyof ReceiptFormState>(key: K, value: ReceiptFormState[K]) =>
    setState((current) => ({ ...current, [key]: value }))

  const needsRate = state.currency !== 'TOMAN'
  const isBackdated = !isToday(state.occurredAt)

  const errors = useMemo<ReceiptFormErrors>(() => {
    const next: ReceiptFormErrors = {}
    if (state.amountOriginal === null || state.amountOriginal <= 0) {
      next.amountOriginal = t`مبلغ را وارد کن؛ باید بزرگ‌تر از صفر باشه.`
    }
    if (needsRate && (state.rate === null || state.rate <= 0)) {
      next.rate = t`برای ارز غیرتومانی، نرخ تبدیل لازمه.`
    }
    return next
  }, [state.amountOriginal, state.rate, needsRate, t])

  const tomanPreview = computeToman(state.amountOriginal ?? 0, state.currency, state.rate)

  return {
    state,
    patch,
    errors,
    /** Errors are only surfaced after a submit attempt, so the form is not hostile while typing. */
    showErrors: submitted,
    isValid: Object.keys(errors).length === 0,
    needsRate,
    /** True when the chosen date is not today — the rate field must relabel and warn. */
    isBackdated,
    tomanPreview,
    markSubmitted: () => setSubmitted(true),
    /** Resets for the next entry, keeping the client so a batch of receipts is fast to log. */
    resetKeepingClient: () => setState((current) => ({ ...emptyState(), clientName: current.clientName, channel: current.channel })),
    reset: () => {
      setState(emptyState())
      setSubmitted(false)
    },
  }
}
