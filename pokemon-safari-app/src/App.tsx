import { useState } from 'react'
import {
  createHashRouter,
  Navigate,
  RouterProvider,
  type RouterProviderProps,
} from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { hasValidCache, hydrateFromStorage, isCacheReady } from '@/services/pokeapi/cache'
import { BootScreen } from '@/screens/BootScreen'
import { DexScreen } from '@/screens/DexScreen'
import { GameScreen } from '@/screens/GameScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { loadSaveWithMeta } from '@/services/save'
import { useUiStore } from '@/store'

/** Sets session save-recovered notice from localStorage parse meta (once per app boot). */
export function bootstrapSaveUi(): void {
  const { recovered } = loadSaveWithMeta()
  if (recovered) useUiStore.getState().setSaveRecovered(true)
}

/** Matches Vite `base: '/pokemon-safari/'` (D-04) for createHashRouter (D-14). */
export const APP_BASENAME = '/pokemon-safari'

/**
 * Hash history paths must include the basename. Empty `#` becomes `/`, which
 * does not match basename and renders nothing — bootstrap before router create.
 */
export function syncHashBasename(
  basename: string = APP_BASENAME,
  loc: Location = window.location,
): void {
  const raw = loc.hash.replace(/^#/, '')
  const path = raw === '' ? '/' : raw.startsWith('/') ? raw : `/${raw}`
  if (path === basename || path.startsWith(`${basename}/`)) {
    return
  }
  const next = path === '/' ? `${basename}/` : `${basename}${path}`
  loc.hash = next
}

/**
 * Cold open without valid cache → first paint is Boot (D-01).
 * Warm cache skips Boot flash (D-03). Deep links to other routes stay put (D-02).
 */
function steerColdOpenToBoot(
  basename: string = APP_BASENAME,
  loc: Location = window.location,
): void {
  // Sync hydrate before first paint — warm cache skips Boot with no flash (D-03).
  hydrateFromStorage()
  if (hasValidCache() && isCacheReady()) {
    useUiStore.getState().setCacheReady(true)
    return
  }

  const raw = loc.hash.replace(/^#/, '')
  const path = raw === '' ? '/' : raw.startsWith('/') ? raw : `/${raw}`
  const atIndex =
    path === '/' || path === basename || path === `${basename}/` || path === `${basename}`
  if (atIndex) {
    loc.hash = `${basename}/boot`
  }
}

export function createAppRouter() {
  syncHashBasename()
  bootstrapSaveUi()
  steerColdOpenToBoot()
  return createHashRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="game" replace /> },
          { path: 'boot', element: <BootScreen /> },
          { path: 'game', element: <GameScreen /> },
          { path: 'dex', element: <DexScreen /> },
          { path: 'settings', element: <SettingsScreen /> },
        ],
      },
    ],
    { basename: APP_BASENAME },
  )
}

type AppProps = {
  router?: RouterProviderProps['router']
}

export default function App({ router: routerProp }: AppProps = {}) {
  const [router] = useState(() => routerProp ?? createAppRouter())
  return <RouterProvider router={router} />
}
