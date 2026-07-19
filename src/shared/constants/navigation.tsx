import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'
import type { ReactNode } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

/** The five pages the brief specifies, in the order of the freelancer's workflow. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'ثبت سریع', icon: <ReceiptLongRoundedIcon /> },
  { to: '/ledger', label: 'دفتر درآمد', icon: <TableRowsRoundedIcon /> },
  { to: '/charts', label: 'نمودارها', icon: <BarChartRoundedIcon /> },
  { to: '/report', label: 'گزارش درآمد', icon: <DescriptionRoundedIcon /> },
  { to: '/settings', label: 'تنظیمات', icon: <SettingsRoundedIcon /> },
]
