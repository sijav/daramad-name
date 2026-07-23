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
  ListItem,
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

// 264 in every desktop and tablet frame of the design.
const RAIL_WIDTH = 264

// Anchored `left` in BOTH directions. The stylis RTL plugin rewrites
// `left`/`right` in the generated CSS, so anchor="left" already lands on the
// visual right in Persian; swapping the anchor by hand double-flips it.
const RAIL_ANCHOR = 'left'

// The design's tablet frames are 834px wide and every one draws the permanent
// rail. MUI's `md` is 900, so at `md` a tablet got the phone chrome instead.
const DESKTOP_MIN_WIDTH = 768

export const AppShell = () => {
  const { t, i18n } = useLingui()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up(DESKTOP_MIN_WIDTH))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()

  // Toggle from the resolved mode, so the button still flips while the stored
  // preference is `system`.
  const resolvedMode = theme.palette.mode
  const changeTheme = useMutation({
    mutationFn: setThemePreferenceMutation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
  })
  const toggleTheme = () => changeTheme.mutate({ themePreference: resolvedMode === 'dark' ? 'light' : 'dark' })

  // One selection rule for the rail and the bottom bar. `path="*"` inside the
  // shell renders the dashboard, so an unmatched URL is a reachable state and
  // falls back to index 0 rather than marking nothing.
  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.to === pathname),
  )

  const railContent = (
    // `nav` wraps the list rather than replacing it: <li> is only valid inside
    // <ul>, and the list semantics are load-bearing too.
    <Box component="nav" aria-label={t`Main navigation`}>
      <List sx={{ p: 1.5 }}>
        {NAV_ITEMS.map((item, index) => (
          // `ListItemButton` renders a <div role="button">, and a <ul> may only
          // contain <li>. Without this wrapper the list publishes no list items
          // at all (axe `list`). `disablePadding` adds none of its own.
          <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={index === activeIndex}
              onClick={() => {
                navigate(item.to)
                setDrawerOpen(false)
              }}
              sx={{
                borderRadius: 999,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.dark,
                  '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              {/* MUI maps the `subtitle2` variant to an <h6>, so without
                  `component: 'span'` all six nav labels enter the accessibility
                  tree as headings, ahead of any content on every page. */}
              <ListItemText slotProps={{ primary: { variant: 'subtitle2', component: 'span' } }}>{i18n._(item.label)}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.glassSurface,
          backdropFilter: elevation.glassBlur,
          borderBottom: `1px solid ${theme.palette.outlineVariant}`,
          color: theme.palette.text.primary,
        }}
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
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: `${radius.sm}px`,
                backgroundColor: theme.palette.brandPrimary,
                color: theme.palette.textOnPrimary,
                fontWeight: 700,
                fontSize: 18,
              }}
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

          {/* The design also draws a notification bell. A local-first tool with
              no background work has nothing to notify about, and the drawn
              control had no panel behind it, it only navigated to the ledger.
              It stays out until there is something to show. */}
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <IconButton onClick={toggleTheme} aria-label={t`Switch theme`}>
              {resolvedMode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </IconButton>
            <IconButton
              aria-label={t`Your details`}
              onClick={() => navigate('/settings')}
              sx={{ backgroundColor: theme.palette.surfaceContainerHigh }}
            >
              <PersonRoundedIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Drawer
          variant="permanent"
          anchor={RAIL_ANCHOR}
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
        <Drawer
          anchor={RAIL_ANCHOR}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          // The paper is the element carrying `role="dialog"`, so the name has
          // to go on the paper slot. Without it the phone's entire navigation
          // opens as an unnamed dialog (axe `aria-dialog-name`).
          slotProps={{ paper: { 'aria-label': t`Main menu` } }}
        >
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
          // Room for the bottom navigation, on the same condition that renders it.
          pb: isDesktop ? 4 : 12,
        }}
      >
        <Outlet />
        <PrivacyFooter />
      </Box>

      {!isDesktop ? (
        <BottomNavigation
          // Named apart from the drawer's nav, which holds the same six links
          // under their full labels, so a screen-reader user meeting both can
          // tell which one they landed in.
          component="nav"
          aria-label={t`Bottom navigation`}
          value={activeIndex}
          onChange={(_event, index: number) => navigate(NAV_ITEMS[index].to)}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: `1px solid ${theme.palette.outlineVariant}`,
            backgroundColor: theme.palette.glassSurface,
            backdropFilter: elevation.glassBlur,
          }}
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
