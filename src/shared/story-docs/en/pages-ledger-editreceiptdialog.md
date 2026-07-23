## props

- `receipt`: The receipt being edited. The dialog is mounted per receipt, so this seeds the form once.
- `onClose`: Save, cancel, Escape and a backdrop click all arrive here.

## stories

- `Foreign Currency`: A receipt in Tether, where the rate and the frozen Toman figure both have to arrive in the form.
- `Toman Receipt`: A toman receipt, which has no conversion, so the rate fields stay out of the way.
- `Opens Pre Filled`: Every field arrives pre-filled, an edit dialog that opens blank loses data.
- `Cancelling Writes Nothing`: Cancelling closes without writing, the receipt on disk is untouched.
- `Saving Keeps The Stored Rate`: Saving revalues at the receipt's stored rate, not at today's. This is the assertion that protects the freeze. If the dialog ever re-derived the Toman value from a current rate, this is where it would show.
