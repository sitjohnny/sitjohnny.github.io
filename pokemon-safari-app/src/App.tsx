import { useState } from 'react'
import {
  createHashRouter,
  RouterProvider,
  type RouterProviderProps,
} from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { DexScreen } from '@/screens/DexScreen'
import { GameScreen } from '@/screens/GameScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { PackScreen } from '@/screens/PackScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'

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

export function createAppRouter() {
  syncHashBasename()
  return createHashRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <HomeScreen /> },
          { path: 'game', element: <GameScreen /> },
          { path: 'dex', element: <DexScreen /> },
          { path: 'pack', element: <PackScreen /> },
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
