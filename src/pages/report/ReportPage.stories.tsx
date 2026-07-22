import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ReportPage } from './ReportPage'

const meta = {
  title: 'Pages/Report',
  component: ReportPage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: '/report' } },
} satisfies Meta<typeof ReportPage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Scenario 3. The fixture has a name set, so the "your name is not set" warning
 * is absent and the PDF button is live.
 */
export const WithData: Story = {}

/** No receipts for the year: the document cannot be produced, and the page says why. */
export const Empty: Story = { parameters: { page: { data: 'empty', route: '/report' } } }

/**
 * Scenario 3. The preview IS the document, so asserting on it asserts on what
 * prints — that equivalence is the whole reason the two share one model, and
 * it is what the reported "preview does not match the file" bug came from.
 *
 * Switching to English must change the VALUES, not just the labels: an embassy
 * officer cannot read «۶۴۴٬۲۶۰٬۰۰۰» or a Persian name.
 */
export const ProducesBothLanguages: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the Persian certificate', async () => {
      await expect(await canvas.findByText('گواهی درآمد')).toBeInTheDocument()
      // Persian numerals, and the figure written out «به حروف» as an Iranian
      // financial document states it.
      await expect(await canvas.findByText(/به حروف/)).toBeInTheDocument()
      await expect(await canvas.findAllByText(/[۰-۹]{1,3}٬[۰-۹]{3}٬[۰-۹]{3}/)).not.toHaveLength(0)
    })

    await step('switch the document to English', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /انگلیسی|English/i }))
    })

    await step('the English certificate carries English values, not just labels', async () => {
      await expect(await canvas.findByText('Statement of Income')).toBeInTheDocument()
      await expect(await canvas.findByText('Raha Mousavi')).toBeInTheDocument()
      await expect(await canvas.findByText(/In words/)).toBeInTheDocument()
      // Latin grouping, and the amount spelled out in English.
      await expect(await canvas.findAllByText(/\d{1,3},\d{3},\d{3}/)).not.toHaveLength(0)
    })
  },
}
