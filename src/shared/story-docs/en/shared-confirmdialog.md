## props

- `onClose`: Cancel, Escape and a backdrop click all arrive here.
- `onConfirm`: The dialog does not close itself on confirm, the caller decides what follows.
- `open`: Mounted always, shown by this. The dialog keeps no state of its own between openings.
- `description`: Exactly what happens on confirm, including what cannot be undone.
- `confirmLabel`: Names the ACTION rather than saying "OK", so the button reads on its own.
- `confirmationWord`: When set, the user must type this exact word to enable the confirm button. This is the second step of the two-step confirmation the brief requires before wiping all data.
- `cancelLabel`: Defaults to the catalog's «انصراف».

## stories

- `Delete Receipt`: The ordinary destructive case, one receipt rather than the whole ledger. No typed word: the loss is a single row, and a confirmation heavy enough for erase-everything would train the user to click through it.
- `Type To Confirm`: The two-step confirmation the brief requires before wiping everything: the confirm button stays disabled until the exact word is typed, and closing the dialog throws the typed word away rather than leaving the next open pre-armed. The globals are pinned because the word the user has to type is a catalog message, «پاک کن», not "erase", so the story would otherwise assert whatever the toolbar happened to be set to.
- `Not Destructive`: `destructive` defaults to false, which colours the confirm button with the brand rather than the error palette. Every dialog in the app today is destructive, so this is the only place the default treatment is visible.
