---
status: testing
phase: 01-app-shell-subpath-site-integration
source: [01-VERIFICATION.md]
started: 2026-07-25T19:47:26Z
updated: 2026-07-25T19:47:26Z
---

## Current Test

number: 1
name: Dev shell + five-tab chrome
expected: |
  Home shows Pokémon Safari + Start Safari; Game/Dex/Pack/Settings placeholders appear; chrome stays usable with large touch targets
awaiting: user response

## Tests

### 1. Dev shell + five-tab chrome
expected: Run `npm run dev` in pokemon-safari-app; on ~390px viewport confirm Home brand + Start Safari and tap all five bottom-nav destinations. Home shows Pokémon Safari + Start Safari; all routes reachable with usable touch chrome.
result: [pending]

### 2. Placeholders only
expected: Confirm no gameplay map while navigating — only EmptyState / Settings stub UI; no map movement, encounters, or capture.
result: [pending]

### 3. Published path + hash refresh
expected: Serve repo root or vite preview; open /pokemon-safari/; refresh on a hash nested route (e.g. #/pokemon-safari/game). App loads with no 404 assets; refresh keeps the shell on the nested hash route.
result: [pending]

### 4. Root + food-crawl intact
expected: Open site root listing and /food-crawl/. Root lists Food Crawl and Pokémon Safari (no sole redirect); food-crawl still loads.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
