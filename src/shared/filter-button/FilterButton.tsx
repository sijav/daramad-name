import { useLingui } from '@lingui/react/macro'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { Badge, Button, type ButtonProps } from '@mui/material'
import { radius } from 'src/core/theme'

export interface FilterButtonProps extends Omit<ButtonProps, 'startIcon' | 'children'> {
  /** How many filters are currently applied; drives the badge. */
  activeCount?: number
}

/**
 * Opens the filter popover, with a count badge when filters are applied.
 *
 * The badge matters for the same reason the chips do — a popover hides its
 * contents, so the trigger has to carry the state.
 */
export const FilterButton = ({ activeCount = 0, sx, ...props }: FilterButtonProps) => {
  const { t } = useLingui()

  return (
    <Badge badgeContent={activeCount} color="primary" overlap="rectangular">
      <Button
        variant="outlined"
        startIcon={<TuneRoundedIcon />}
        sx={[{ borderRadius: `${radius.full}px`, height: 44 }, ...(Array.isArray(sx) ? sx : [sx])]}
        {...props}
      >
        {t`Filters`}
      </Button>
    </Badge>
  )
}
