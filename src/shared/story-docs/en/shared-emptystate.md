## props

- `title`: What is empty, in the user’s terms. Blank falls back to the story’s translated sample.
- `description`: Why the page matters and what to do next. Rule 6 forbids a bare "no data" message.
- `actionLabel`: The button. Omitted when there is genuinely nothing to press yet.
- `icon`: Optional 72px circle above the text.
- `onAction`: Fired by the button, the page decides what "the first action" is.

## stories

- `First Run`: Rule 6: never a dead blank screen, say why the page matters, offer the first action.
- `No Filter Matches`: A filtered-to-empty ledger is a different situation and gets different words.
- `Message Only`: Both decorations are optional, and the report page proves it: until a receipt exists there is nothing to press, and offering a dead button would be worse than offering none. The block still has to read as content, heading, sentence, centred, rather than as a component that failed to render.
