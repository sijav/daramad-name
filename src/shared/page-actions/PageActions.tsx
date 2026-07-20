import { useLingui } from '@lingui/react/macro'
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded'
import { Button, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { RangeSelect, type RangeSelectOption } from 'src/shared/range-select'

export interface PageActionsProps {
  year: number
  years: number[]
  onYearChange: (year: number) => void
  formatYear: (year: number) => string
}

/**
 * The leading cluster the design repeats in every page header: the primary
 * "record a receipt" button, then the report-range pill.
 *
 * Button first in the DOM so RTL puts it on the reading-start side, matching
 * the design's `183:288` frame where the pill sits furthest from the title.
 */
export const PageActions = ({ year, years, onYearChange, formatYear }: PageActionsProps) => {
  const { t } = useLingui()
  const navigate = useNavigate()

  const options: RangeSelectOption[] = (years.length > 0 ? years : [year]).map((option) => ({
    value: option,
    label: t`year ${formatYear(option)}`,
  }))

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Button variant="contained" endIcon={<AddCircleOutlineRoundedIcon />} onClick={() => navigate('/quick-entry')}>
        {t`Record a receipt`}
      </Button>
      <RangeSelect value={year} options={options} onSelect={(value) => onYearChange(Number(value))} prefix={t`Report range`} />
    </Stack>
  )
}
