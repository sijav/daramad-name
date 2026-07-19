import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import type { ReactNode } from 'react'

export interface NavItem {
  to: string
  label: MessageDescriptor
  icon: ReactNode
}

/**
 * The six destinations in the design's Nav Rail, in its order.
 *
 * «نمای کلی» (Overview) is the landing page; the brief's five pages all remain
 * behind it. The rail confirmed the structure — the redesign added a dashboard
 * rather than replacing anything.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: msg`Overview`, icon: <DashboardRoundedIcon /> },
  { to: '/quick-entry', label: msg`Quick entry`, icon: <BoltRoundedIcon /> },
  { to: '/ledger', label: msg`Income ledger`, icon: <MenuBookRoundedIcon /> },
  { to: '/charts', label: msg`Charts`, icon: <BarChartRoundedIcon /> },
  { to: '/report', label: msg`Income report`, icon: <DescriptionRoundedIcon /> },
  { to: '/settings', label: msg`Settings`, icon: <TuneRoundedIcon /> },
]
