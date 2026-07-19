import { Trans, useLingui } from '@lingui/react/macro'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from 'src/shared/constants'
import { PrivacyFooter } from 'src/shared/privacy-footer'

const RAIL_WIDTH = 248

/**
 * The app frame: top bar, side rail on desktop, bottom navigation on mobile.
 *
 * Rule 1 takes mobile seriously — half the demo-link traffic arrives on a
 * phone. Rather than squeezing the rail into a drawer only, small screens get a
 * thumb-reachable bottom bar, which is how people actually navigate a phone.
 */
export const AppShell = () => {
  const { t, i18n } = useLingui()
  const theme = useTheme()
  // The rail follows reading order: trailing edge in RTL, leading edge in LTR.
  // Hardcoding `right` leaves it overlapping the content once the user switches
  // to English.
  const isRtl = theme.direction === 'rtl'
  const railAnchor = isRtl ? 'right' : 'left'
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.to === pathname),
  )

  const railContent = (
    <List sx={{ p: 1.5 }}>
      {NAV_ITEMS.map((item) => {
        const selected = item.to === pathname
        return (
          <ListItemButton
            key={item.to}
            selected={selected}
            onClick={() => {
              navigate(item.to)
              setDrawerOpen(false)
            }}
            sx={(t) => ({
              borderRadius: 999,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: t.palette.primary.light,
                color: t.palette.primary.dark,
                '& .MuiListItemIcon-root': { color: t.palette.primary.main },
              },
            })}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText slotProps={{ primary: { variant: 'subtitle2' } }}>{i18n._(item.label)}</ListItemText>
          </ListItemButton>
        )
      })}
    </List>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={(t) => ({
          zIndex: t.zIndex.drawer + 1,
          backgroundColor: t.palette.glassSurface,
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${t.palette.outlineVariant}`,
          color: t.palette.text.primary,
        })}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop ? (
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label={t`Open menu`}>
              <MenuRoundedIcon />
            </IconButton>
          ) : null}

          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
            <Typography variant="h3" component="h1">
              <Trans>Daramadname</Trans>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Trans>Receipts ledger and income report</Trans>
            </Typography>
          </Stack>
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Drawer
          variant="permanent"
          anchor={railAnchor}
          sx={{
            width: RAIL_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: RAIL_WIDTH,
              boxSizing: 'border-box',
              border: 0,
              [isRtl ? 'borderLeft' : 'borderRight']: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: 'transparent',
              backdropFilter: 'none',
            },
          }}
        >
          <Toolbar />
          {railContent}
        </Drawer>
      ) : (
        <Drawer anchor={railAnchor} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: RAIL_WIDTH }}>
            <Toolbar />
            {railContent}
          </Box>
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 10, md: 12 },
          // Room for the bottom navigation on small screens.
          pb: { xs: 12, md: 4 },
        }}
      >
        <Outlet />
        <PrivacyFooter />
      </Box>

      {!isDesktop ? (
        <BottomNavigation
          value={activeIndex}
          onChange={(_event, index: number) => navigate(NAV_ITEMS[index].to)}
          showLabels
          sx={(t) => ({
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: t.zIndex.appBar,
            borderTop: `1px solid ${t.palette.outlineVariant}`,
            backgroundColor: t.palette.glassSurface,
            backdropFilter: 'blur(16px)',
          })}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction key={item.to} label={i18n._(item.label)} icon={item.icon} sx={{ minWidth: 0, px: 0.5 }} />
          ))}
        </BottomNavigation>
      ) : null}
    </Box>
  )
}
