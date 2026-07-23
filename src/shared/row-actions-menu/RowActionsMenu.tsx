import { useLingui } from '@lingui/react/macro'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material'
import { useState, type MouseEvent } from 'react'

export interface RowActionsMenuProps {
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

/**
 * The design's row-actions kebab: one trigger per ledger row opening view /
 * edit / delete.
 *
 * Replaces the two always-visible icon buttons. With a `Tag` and an actions
 * column already competing for space, three inline buttons crowded the row
 * and a menu gives each action a readable label instead of an icon the user has
 * to decode.
 */
export const RowActionsMenu = ({ onView, onEdit, onDelete }: RowActionsMenuProps) => {
  const { t } = useLingui()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const run = (action: () => void) => () => {
    setAnchorEl(null)
    action()
  }

  return (
    <>
      <Tooltip title={t`Actions`}>
        <IconButton
          size="small"
          onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
          aria-label={t`Actions`}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={run(onView)}>
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t`View details`}</ListItemText>
        </MenuItem>

        <MenuItem onClick={run(onEdit)}>
          <ListItemIcon>
            <EditRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t`Edit`}</ListItemText>
        </MenuItem>

        <MenuItem onClick={run(onDelete)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>{t`Delete`}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
