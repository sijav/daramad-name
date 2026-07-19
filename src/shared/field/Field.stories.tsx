import { useLingui } from '@lingui/react/macro'
import { TextField } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from './Field'

const meta = { title: 'Shared/Field', component: Field } satisfies Meta<typeof Field>
export default meta
type Story = StoryObj<typeof meta>

/**
 * The design's `Field`: the label sits ABOVE the control, not as a MUI floating
 * label inside the outline. Every input in the design uses this treatment, so
 * it is a wrapper rather than a per-field style override — labels stay readable
 * at rest, which is what makes the 15-second entry path scannable.
 */
const Basic = () => {
  const { t } = useLingui()
  return (
    <Field label={t`Client / project`}>
      <TextField fullWidth placeholder={t`Type or pick a client name`} />
    </Field>
  )
}

const WithError = () => {
  const { t } = useLingui()
  return (
    <Field label={t`Today's exchange rate (Toman)`} error helperText={t`A non-Toman currency needs an exchange rate.`}>
      <TextField fullWidth error />
    </Field>
  )
}

const Multiline = () => {
  const { t } = useLingui()
  return (
    <Field label={t`Note (optional)`}>
      <TextField fullWidth multiline minRows={3} placeholder={t`e.g. deposit for design phase one`} />
    </Field>
  )
}

const base = { label: '', children: null }

export const Default: Story = { args: base, render: () => <Basic /> }

/** The helper text turns red and sits under the control rather than shifting it. */
export const Invalid: Story = { args: base, render: () => <WithError /> }

/** A multiline control opts out of the fixed 52px height so notes can grow. */
export const WithMultiline: Story = { args: base, render: () => <Multiline /> }
