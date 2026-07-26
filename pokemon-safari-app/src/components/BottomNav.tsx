import { NavLink, useLocation } from 'react-router-dom'
import { useEncounterStore } from '@/store/encounterStore'
import { useUiStore } from '@/store'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true, icon: HomeIcon },
  { to: '/game', label: 'Game', end: false, icon: GameIcon },
  { to: '/dex', label: 'Dex', end: false, icon: DexIcon },
  { to: '/pack', label: 'Pack', end: false, icon: PackIcon },
  { to: '/settings', label: 'Settings', end: false, icon: SettingsIcon },
] as const

export function BottomNav() {
  const setLastRoute = useUiStore((s) => s.setLastRoute)
  const dexSheetOpen = useUiStore((s) => s.dexSheetOpen)
  const encounterActive = useEncounterStore((s) => s.stage !== 'idle')
  const { pathname } = useLocation()
  const isGameRoute = pathname === '/game'
  const isDexRoute = pathname === '/dex'
  const navInert =
    (isGameRoute && encounterActive) || (isDexRoute && dexSheetOpen)

  return (
    <nav
      aria-label="Main"
      inert={navInert ? true : undefined}
      className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[480px] bg-secondary pb-[env(safe-area-inset-bottom)] text-on-secondary"
    >
      <ul className="flex items-stretch justify-around gap-1 px-1 pt-1">
        {NAV_ITEMS.map(({ to, label, end, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              onClick={() => setLastRoute(to)}
              className={({ isActive }) =>
                [
                  'touch-target relative flex w-full flex-col items-center justify-center gap-1 rounded-sm px-1 py-2 text-center transition-[color,transform] duration-150 ease-out',
                  isActive ? 'text-accent' : 'text-on-secondary/80',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon />
                  <span className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4]">
                    {label}
                  </span>
                  <span aria-hidden="true"
                    className={[
                      'absolute bottom-0 left-1/2 h-1 w-6 -translate-x-1/2 rounded-sm bg-accent transition-transform duration-150 ease-out motion-reduce:transition-none',
                      isActive ? 'scale-x-100' : 'scale-x-0',
                    ].join(' ')}
                  />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function HomeIcon() {
  return (
    <svg aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}

function GameIcon() {
  return (
    <svg aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M4 18c2-4 4-8 8-8s6 4 8 8" />
      <path d="M8 10c1-2 2-4 4-4s3 2 4 4" />
      <path d="M7 18h2M15 18h2" />
    </svg>
  )
}

function DexIcon() {
  return (
    <svg aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4z" />
      <path d="M8 4v16" />
    </svg>
  )
}

function PackIcon() {
  return (
    <svg aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M6 8h12l1 12H5L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  )
}
