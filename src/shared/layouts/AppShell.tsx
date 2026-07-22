import { Trans, useLingui } from '@lingui/react/macro'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { elevation, radius } from 'src/core/theme'
import { NAV_ITEMS } from 'src/shared/constants'
import { PrivacyFooter } from 'src/shared/privacy-footer'
import { setThemePreferenceMutation, settingsQueryKey } from 'src/shared/queries'

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
  // The rail is anchored `left` in BOTH directions on purpose.
  //
  // The stylis RTL plugin rewrites `left`/`right` in the generated CSS, so a
  // Drawer with anchor="left" already lands on the visual right in Persian.
  // Swapping the anchor ourselves double-flips it and puts the rail on the
  // wrong side — which is exactly what a manual swap did here before.
  const railAnchor = 'left' as const
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()

  // The top bar's theme button flips between light and dark from whatever is
  // currently resolved, so it also works while the preference is `system`.
  const resolvedMode = theme.palette.mode
  const changeTheme = useMutation({
    mutationFn: setThemePreferenceMutation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
  })
  const toggleTheme = () => changeTheme.mutate({ themePreference: resolvedMode === 'dark' ? 'light' : 'dark' })

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
          backdropFilter: elevation.glassBlur,
          borderBottom: `1px solid ${t.palette.outlineVariant}`,
          color: t.palette.text.primary,
        })}
      >
        <Toolbar sx={{ gap: 1, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {!isDesktop ? (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label={t`Open menu`}>
                <MenuRoundedIcon />
              </IconButton>
            ) : null}

            {/* The design's brand lockup: wordmark beside a filled 36px tile. */}
            <Box
              sx={(t) => ({
                display: 'grid',
                placeItems: 'center',
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: `${radius.sm}px`,
                backgroundColor: t.palette.brandPrimary,
                color: t.palette.textOnPrimary,
                fontWeight: 700,
                fontSize: 18,
              })}
            >
              ₮
            </Box>
            <Typography variant="h3" component="h1">
              <Trans>Daramadname</Trans>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', md: 'block' } }}>
              <Trans>Receipts ledger and income report</Trans>
            </Typography>
          </Stack>

          {/* Theme toggle and account. The design also draws a notification
              bell, but there is nothing to notify about in a local-first tool
              with no background work — it had no panel and merely navigated to
              the ledger. A control that does something other than what its
              icon promises is worse than an absent one, so it stays out until
              there is a panel behind it. */}
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <IconButton onClick={toggleTheme} aria-label={t`Switch theme`}>
              {resolvedMode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </IconButton>
            <IconButton
              aria-label={t`Your details`}
              onClick={() => navigate('/settings')}
              sx={(t) => ({ backgroundColor: t.palette.surfaceContainerHigh })}
            >
              <PersonRoundedIcon />
            </IconButton>
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
              // Also flipped by the RTL plugin, so it is written once for LTR.
              borderRight: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: 'transparent',
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
            backdropFilter: elevation.glassBlur,
          })}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.to}
              label={i18n._(item.shortLabel ?? item.label)}
              icon={item.icon}
              sx={{ minWidth: 0, px: 0.5 }}
            />
          ))}
        </BottomNavigation>
      ) : null}
    </Box>
  )
}
