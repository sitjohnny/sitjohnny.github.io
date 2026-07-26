# Remove Home Tab Design

**Date:** 2026-07-26  
**Status:** Approved

## Goal

Remove the Home landing tab. Opening Pokémon Safari puts the player into Game after Gen 1 cache is ready. Cold loads still use Boot for progress, then enter Game automatically.

## Scope

**In scope**

- Delete `HomeScreen` and the Home bottom-nav entry
- Redirect index `/` to `/game`
- Boot ready (and Boot quota dismiss) navigate to `/game` instead of `/`
- Default `lastRoute` to `/game`
- Update tests and copy/comments that treat Home as a primary destination

**Out of scope**

- Changing Boot prefetch / cache pipeline behavior
- Folding Boot UI into Game
- Dex, Settings, or Phase 7 work

## Landing rules

| Situation | First paint / next route |
|-----------|--------------------------|
| Cold open (no ready cache) at `/` | `/boot` via existing `steerColdOpenToBoot` |
| Boot finishes (`status === 'ready'`) | `navigate('/game', { replace: true })` |
| Boot quota dismiss | `navigate('/game', { replace: true })` |
| Warm cache at `/` | Index redirects to `/game` |
| Deep link `/game`, `/dex`, `/settings`, `/boot` | Stay put |

## Navigation

Bottom nav becomes three tabs: **Game**, **Dex**, **Settings**.

Delete:

- Home nav entry and `HomeIcon`
- `HomeScreen` module and its route element
- “Start Safari” CTA (only lived on Home)

Index route: `{ index: true, element: <Navigate to="game" replace /> }` (or equivalent React Router redirect). Do not leave a dead Home screen reachable.

## Defaults and gate

- `useUiStore` `lastRoute` default: `'/game'`
- Game’s `CacheGateNotice` remains as a fallback when `/game` is opened before cache is ready
- Update CacheGateNotice body/comments that say Home is a reachable destination; keep “Safari is still packing…” heading (load copy, not Home branding)

## Testing

Update or remove tests that assume:

- First paint shows Home brand / “Start Safari”
- BottomNav includes Home (four or five links)
- Home remains reachable outside the Game gate as a product requirement
- Boot navigates to `/` on ready

App smoke: warm cache → Game (Forest / walk controls). BottomNav: three accessible links. Boot→Game path covered where existing Boot tests assert destination.

## Error handling

No new failure modes. Hash `/` redirects to Game; cold `/` still steers to Boot before the router paints Home. Orphan bookmarks to Home are gone with the screen.
