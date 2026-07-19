import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SearchField } from './SearchField'

const meta = { title: 'Shared/SearchField', component: SearchField } satisfies Meta<typeof SearchField>
export default meta
type Story = StoryObj<typeof meta>

const Controlled: Story['render'] = function Render(args) {
  const [value, setValue] = useState(args.value)
  return <SearchField {...args} value={value} onValueChange={setValue} sx={{ width: 420 }} />
}

export const Empty: Story = { args: { value: '', onValueChange: () => {} }, render: Controlled }

/** The clear button only appears once there is something to clear. */
export const WithQuery: Story = { args: { value: 'آریا', onValueChange: () => {} }, render: Controlled }
