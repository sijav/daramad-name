import { Button } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { FIXTURE_CLIENTS, seedDatabase } from 'src/shared/story-fixtures'
import type { LedgerFilter } from 'src/shared/types'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { LedgerFilterPopover } from './LedgerFilterPopover'

// The popover edits a DRAFT and commits only on Apply.
//
// That matters twice over. Live-applying each keystroke would refetch the
// ledger constantly, and the intermediate "from is set, to is not" state would
// briefly match nothing. And the date fields start EMPTY: they used to default
// to today, which advertised a range that was never applied, while touching one
// end silently invented the other — producing an inverted range Dexie matches
// nothing for, with no explanation on screen.

/** The popover needs a real anchor element, so the story supplies one. */
const Harness = ({
  filter = {},
  onApply,
  onClose,
}: {
  filter?: LedgerFilter
  onApply: (next: LedgerFilter) => void
  onClose: () => void
}) => {
  // A callback ref into state rather than a `useRef`: the popover needs the
  // anchor ELEMENT on the render after it mounts, and reading `ref.current`
  // during render is exactly what React 19 forbids.
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)

  return (
    <>
      <Button ref={setAnchor}>anchor</Button>
      <LedgerFilterPopover anchorEl={anchor} filter={filter} onApply={onApply} onClose={onClose} />
    </>
  )
}

const meta = {
  title: 'Pages/Ledger/FilterPopover',
  component: LedgerFilterPopover,
  parameters: { layout: 'padded', page: { route: '/ledger' } },
  beforeEach: async () => await seedDatabase(),
} satisfies Meta<typeof LedgerFilterPopover>

export default meta
type Story = StoryObj<typeof meta>

const args = { anchorEl: null, filter: {}, onApply: fn(), onClose: fn() }

export const Open: Story = {
  args,
  render: (a) => <Harness onApply={a.onApply} onClose={a.onClose} />,
}

/** Reopened on an existing filter, the draft starts from what is already applied. */
export const PreFilledFromTheActiveFilter: Story = {
  args,
  render: (a) => <Harness filter={{ channel: 'TETHER' }} onApply={a.onApply} onClose={a.onClose} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)

    await expect(await body.findByText(/^تتر$|^Tether$/)).toBeInTheDocument()
  },
}

/** Both date fields open EMPTY — never today, which would advertise a filter that is not applied. */
export const DatesStartEmpty: Story = {
  args,
  render: (a) => <Harness onApply={a.onApply} onClose={a.onClose} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    // The anchor is only set after the harness mounts, so wait for the popover
    // to exist before reaching into it.
    await body.findByText(/^از تاریخ$|^From date$/)

    const popover = canvasElement.ownerDocument.querySelector('.MuiPopover-paper')!
    const labelled = (label: RegExp) =>
      [...popover.querySelectorAll('label')].find((node) => label.test(node.querySelector('span')?.textContent ?? ''))

    for (const label of [/^از تاریخ$|^From date$/, /^تا تاریخ$|^To date$/]) {
      const field = labelled(label)
      await expect(field).toBeTruthy()
      // The picker renders its digits as text; no digits means an empty field.
      await expect((field?.textContent ?? '').replace(/\D/g, '')).toBe('')
    }
  },
}

/** Apply commits the draft in one go. */
export const ApplyCommitsTheDraft: Story = {
  args,
  render: (a) => <Harness onApply={a.onApply} onClose={a.onClose} />,
  play: async ({ canvasElement, args: a }) => {
    const body = within(canvasElement.ownerDocument.body)
    const client = FIXTURE_CLIENTS[0]

    await userEvent.type(await body.findByRole('combobox', { name: /مشتری|Client/i }), client.name)
    await userEvent.click(await body.findByRole('option', { name: new RegExp(client.name, 'i') }))
    await userEvent.click(await body.findByRole('button', { name: /^اعمال فیلترها$|^Apply filters$/ }))

    await expect(a.onApply).toHaveBeenCalledWith(expect.objectContaining({ clientId: client.id }))
  },
}

/** Reset empties the draft without committing anything. */
export const ResetClearsWithoutApplying: Story = {
  args,
  render: (a) => <Harness filter={{ channel: 'TETHER' }} onApply={a.onApply} onClose={a.onClose} />,
  play: async ({ canvasElement, args: a }) => {
    const body = within(canvasElement.ownerDocument.body)

    await expect(await body.findByText(/^تتر$|^Tether$/)).toBeInTheDocument()
    await userEvent.click(await body.findByRole('button', { name: /^بازنشانی$|^Reset$/ }))

    // The draft actually emptied — the Channel select falls back to its
    // all-channels option. Asserting only that nothing was committed passes
    // just as well when Reset does nothing at all.
    await waitFor(() => expect(body.queryByText(/^تتر$|^Tether$/)).toBeNull())
    // And nothing is committed until Apply — Reset only touches the draft.
    await expect(a.onApply).not.toHaveBeenCalled()
  },
}
