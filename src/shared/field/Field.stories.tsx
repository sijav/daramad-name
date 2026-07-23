import { useLingui } from '@lingui/react/macro'
import { TextField } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Field } from './Field'

const meta = {
  title: 'Shared/Field',
  component: Field,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    labelId: {
      control: 'text',
    },
    children: { control: false },
  },
  args: { label: '', helperText: '', error: false, children: null },
} satisfies Meta<typeof Field>
export default meta
type Story = StoryObj<typeof meta>

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

export const NamesItsControl: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('textbox', { name: 'مشتری / پروژه' })).toBeInTheDocument()
    await expect(canvas.queryAllByRole('heading')).toHaveLength(0)
  },
}

export const NamesAMultilineControl: Story = {
  ...WithMultiline,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('textbox', { name: 'یادداشت (اختیاری)' })).toBeInTheDocument()
  },
}
