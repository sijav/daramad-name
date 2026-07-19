import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'
import type { ReactNode } from 'react'

export interface NavItem {
  to: string
  label: MessageDescriptor
  icon: ReactNode
}

/** The five pages the brief specifies, in the order of the freelancer's workflow. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: msg`Quick entry`, icon: <ReceiptLongRoundedIcon /> },
  { to: '/ledger', label: msg`Income ledger`, icon: <TableRowsRoundedIcon /> },
  { to: '/charts', label: msg`Charts`, icon: <BarChartRoundedIcon /> },
  { to: '/report', label: msg`Income report`, icon: <DescriptionRoundedIcon /> },
  { to: '/settings', label: msg`Settings`, icon: <SettingsRoundedIcon /> },
]
