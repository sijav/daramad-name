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
 * Form state for recording and editing a receipt, and the home of the
 * backdating rule.
 *
 * A rate field defaulting to "today's rate" on a receipt dated two months back
 * values it at today's Tether price, and the toman value is frozen on save, so
 * the error is permanent. The form cannot know the historical rate, there is no
 * rate API by design, so it exposes `isBackdated` and the UI relabels and warns.
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
      next.amountOriginal = t`Enter an amount greater than zero.`
    }
    if (needsRate && (state.rate === null || state.rate <= 0)) {
      next.rate = t`A non-Toman currency needs an exchange rate.`
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
    /** True when the chosen date is not today, the rate field must relabel and warn. */
    isBackdated,
    tomanPreview,
    markSubmitted: () => setSubmitted(true),
    /**
     * Resets for the next entry, keeping the client, channel and DATE, so a
     * stack of old invoices stays fast to log. Resetting the date to today
     * would undo the backdating on every receipt after the first, and the
     * warning would go with it.
     */
    resetKeepingClient: () => {
      setState((current) => ({
        ...emptyState(),
        clientName: current.clientName,
        channel: current.channel,
        occurredAt: current.occurredAt,
      }))
      // The submit flag goes with the values, or the emptied amount is invalid
      // the instant it clears and a saved receipt is answered with a red
      // "enter an amount" on the next one.
      setSubmitted(false)
    },
    reset: () => {
      setState(emptyState())
      setSubmitted(false)
    },
  }
}
