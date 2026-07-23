The Settings row that installs the app to the home screen.

It renders nothing at all until the browser says installation is possible.
which is a state no test runner can produce on its own, so the stories build
the `beforeinstallprompt` event by hand and fire it from a parent effect.

## stories

- `Not Offered`: Nothing is rendered until the browser offers installation, which is the state every visit starts in, and the only state Firefox and iOS ever reach.
- `Offered`: Once Chrome has fired the event, the section appears with the install button.
- `Prompts And Clears`: Pressing the button opens the browser's dialog, and the handle is spent afterwards, so the section removes itself rather than offering a second press, which would throw.
