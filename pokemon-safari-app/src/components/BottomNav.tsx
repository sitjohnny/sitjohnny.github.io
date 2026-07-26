import { NavLink, useLocation } from 'react-router-dom'
import pokeballIcon from '@/assets/nav/pokeball.png'
import dexIcon from '@/assets/nav/dex.png'
import { useEncounterStore } from '@/store/encounterStore'
import { useUiStore } from '@/store'

const NAV_ITEMS = [
  { to: '/game', label: 'Game', end: false, icon: GameIcon },
  { to: '/dex', label: 'Pokédex', end: false, icon: DexIcon },
  { to: '/settings', label: 'Settings', end: false, icon: SettingsIcon },
] as const

export function BottomNav() {
  const setLastRoute = useUiStore((s) => s.setLastRoute)
  const dexSheetOpen = useUiStore((s) => s.dexSheetOpen)
  const encounterActive = useEncounterStore((s) => s.stage !== 'idle')
  const { pathname } = useLocation()
  const isGameRoute = pathname === '/game'
  const isDexRoute = pathname === '/dex'
  const navInert = (isGameRoute && encounterActive) || (isDexRoute && dexSheetOpen)

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
                  <span
                    aria-hidden="true"
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

function GameIcon() {
  return (
    <img
      src={pokeballIcon}
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      className="size-6 object-contain"
      draggable={false}
    />
  )
}

function DexIcon() {
  return (
    <img
      src={dexIcon}
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      className="size-6 object-contain"
      draggable={false}
    />
  )
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
