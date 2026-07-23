## props

- `onSubmitAndNext`: «ذخیره و بعدی», omitted when editing an existing receipt.
- `onSubmit`: Fires only once the form validates, the page does not re-check.
- `form`: The whole form state, from `useReceiptForm`. The caller owns it so the page can seed and reset it.
- `submitLabel`: «ثبت دریافتی» when recording, «ذخیره تغییرات» when editing.
- `pending`: Disables both submit buttons and shows a spinner while the write is in flight.

## stories

- `Empty`: The 15-second path: today's date, toman, card-to-card, amount autofocused.
- `Foreign Currency`: A non-toman currency reveals the rate field and the live toman equivalent.
- `Backdated`: The backdating case. With a past date the rate field relabels to "the rate on that date" and warns, because the toman value freezes permanently, entering today's rate against a two-month-old receipt would be silently wrong forever.
- `Pending`: Saving is in flight: both buttons go dead so one receipt cannot be logged twice.
- `Editing`: The edit dialog. «ذخیره و بعدی» is for logging a batch; offering it while editing an existing receipt would promise a "next" that does not exist.
- `Records A Foreign Receipt`: Scenario 1, driven rather than read from a fixture: type an amount, pick Tether, type the day's rate, and the Toman equivalent appears immediately and is marked frozen. This is the number the whole tool exists to be right about, it is stored on write and never recomputed, so a wrong one here is wrong permanently.
- `Warns When Backdated`: Scenario 5. A past date must change what the rate field ASKS FOR: entering today's rate against a two-month-old receipt freezes a wrong number forever, and nothing downstream can detect it.
- `Stays Quiet Until You Try To Save`: Errors wait for a submit attempt. An empty form is invalid from the first frame, and shouting about it before the user has typed anything makes the one screen that has to be fast feel hostile.
- `Blocks Saving Without An Amount`: An empty amount must not save. A receipt of nothing is not a receipt, and one that got through would sit in the ledger contributing zero to a total the user believes is complete.
- `Blocks Foreign Currency Without A Rate`: The one that matters most. A foreign-currency receipt with no rate stores a toman value of zero, and that value is FROZEN, it is never recomputed, so nothing later can repair it. The receipt then sits in the ledger looking complete and contributing nothing to the total on the certificate.
- `Returning To Toman Clears The Rate`: Going back to toman throws the rate away. Keeping it would let a rate typed for one currency be silently reused for another, 98,500 entered for Tether and then applied to dollars is a receipt three times its real size, frozen.
- `Save And Next Keeps The Client And Channel`: «ذخیره و بعدی» exists so a freelancer can log a morning's receipts in one pass: the amount and the note clear, the client and the channel stay. Losing the client on every save is what makes people stop after the second one.
- `Records The Client Channel And Note`: The rest of the form actually records what is typed into it, and a plain save clears ALL of it, including the client, because a finished entry is not the start of a batch.
