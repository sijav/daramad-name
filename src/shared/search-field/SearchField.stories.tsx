import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { SearchField } from './SearchField'

const meta = {
  title: 'Shared/SearchField',
  component: SearchField,
} satisfies Meta<typeof SearchField>
export default meta
type Story = StoryObj<typeof meta>

const Controlled: Story['render'] = function Render(args) {
  const [value, setValue] = useState(args.value)
  return (
    <SearchField
      {...args}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        args.onValueChange(next)
      }}
      sx={{ width: 420 }}
    />
  )
}

export const Empty: Story = { args: { value: '', onValueChange: fn() }, render: Controlled }

export const WithQuery: Story = { args: { value: 'آریا', onValueChange: fn() }, render: Controlled }

const CLEAR = /^پاک کردن جست‌وجو$|^Clear search$/
const SEARCH = /^جست‌وجو در دریافتی‌ها$|^Search receipts$/

export const ClearAppearsOnlyWithAQuery: Story = {
  ...Empty,
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('an empty field is named but offers nothing to clear', async () => {
      await canvas.findByRole('textbox', { name: SEARCH })
      await expect(canvas.queryByRole('button', { name: CLEAR })).toBeNull()
    })

    await step('typing reports every keystroke upward and reveals the clear button', async () => {
      await userEvent.type(await canvas.findByRole('textbox', { name: SEARCH }), 'آریا')
      await expect(args.onValueChange).toHaveBeenLastCalledWith('آریا')
      await expect(await canvas.findByRole('button', { name: CLEAR })).toBeInTheDocument()
    })

    await step('clearing empties the field and reports it, rather than only hiding the button', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: CLEAR }))
      await expect(args.onValueChange).toHaveBeenLastCalledWith('')
      await waitFor(async () => expect(await canvas.findByRole('textbox', { name: SEARCH })).toHaveValue(''))
      await expect(canvas.queryByRole('button', { name: CLEAR })).toBeNull()
    })
  },
}
