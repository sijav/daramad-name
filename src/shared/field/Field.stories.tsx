import { useLingui } from '@lingui/react/macro'
import { TextField } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Field } from './Field'

/**
 * The design's `Field`: the label sits ABOVE the control, not as a MUI floating
 * label inside the outline. Every input in the design uses this treatment, so
 * it is a wrapper rather than a per-field style override — labels stay readable
 * at rest, which is what makes the 15-second entry path scannable.
 *
 * Each story spreads its args and falls back per field, so the sample copy
 * follows the Language toolbar while anything typed into Controls wins.
 */
const meta = {
  title: 'Shared/Field',
  component: Field,
  argTypes: {
    label: { control: 'text', description: 'The caption above the control. Blank falls back to the story’s translated sample.' },
    helperText: { control: 'text', description: 'Sits under the control, in the error colour when `error` is set.' },
    error: { control: 'boolean', description: 'Turns the helper text red. The control itself is styled by its own `error` prop.' },
    fullWidth: { control: 'boolean', description: 'Stretches the wrapper; off, it shrinks to the control’s own width.' },
    labelId: {
      control: 'text',
      description: 'Put on the label text, for a control a `<label>` cannot name — MUI X’s picker renders a `role="group"`.',
    },
    children: { control: false, description: 'The control being labelled.' },
  },
  args: { label: '', helperText: '', error: false, children: null },
} satisfies Meta<typeof Field>
export default meta
type Story = StoryObj<typeof meta>

/** A plain text control, which is what most of the entry form is. */
export const Default: Story = {
  render: (args) => {
    const { t } = useLingui()
    return (
      <Field {...args} label={args.label || t`Client / project`}>
        <TextField fullWidth placeholder={t`Type or pick a client name`} />
      </Field>
    )
  },
}

/** The helper text turns red and sits under the control rather than shifting it. */
export const Invalid: Story = {
  args: { error: true },
  render: (args) => {
    const { t } = useLingui()
    return (
      <Field
        {...args}
        label={args.label || t`Today's exchange rate (Toman)`}
        helperText={args.helperText || t`A non-Toman currency needs an exchange rate.`}
      >
        <TextField fullWidth error={args.error} />
      </Field>
    )
  },
}

/** A multiline control opts out of the fixed 52px height so notes can grow. */
export const WithMultiline: Story = {
  render: (args) => {
    const { t } = useLingui()
    return (
      <Field {...args} label={args.label || t`Note (optional)`}>
        <TextField fullWidth multiline minRows={3} placeholder={t`e.g. deposit for design phase one`} />
      </Field>
    )
  },
}

/**
 * The wrapper is the `<label>`, which is what gives the control its name.
 *
 * It used to be a sibling `<Typography component="label">` with no `htmlFor`,
 * associating nothing: every input in the app computed an EMPTY accessible
 * name. The caption is also asserted NOT to be a heading — MUI maps the
 * `subtitle2` variant onto `<h6>`, so a field label would otherwise publish
 * itself as one.
 */
export const NamesItsControl: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('textbox', { name: 'مشتری / پروژه' })).toBeInTheDocument()
    await expect(canvas.queryAllByRole('heading')).toHaveLength(0)
  },
}

/**
 * A multiline control is named by the same wrapper — the `<label>` reaches a
 * `<textarea>` exactly as it reaches an `<input>`.
 */
export const NamesAMultilineControl: Story = {
  ...WithMultiline,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('textbox', { name: 'یادداشت (اختیاری)' })).toBeInTheDocument()
  },
}
