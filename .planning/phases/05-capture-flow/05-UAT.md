---
status: testing
phase: 05-capture-flow
source: [05-VERIFICATION.md]
started: 2026-07-26T14:55:00Z
updated: 2026-07-26T14:55:00Z
---

## Current Test

number: 1
name: Second-throw flash ordering
expected: |
  Grade flash visibly precedes the ball on every throw, including retries.
awaiting: user response

## Tests

### 1. Second-throw flash ordering
expected: Fail the first throw deliberately, then confirm the grade word flashes before the ball appears and shakes on the retry throw.
result: pending

### 2. Happy-path catch with math boost
expected: A common encounter with a correct answer flows through Math boost chip → grade flash → shake → Gotcha!, and Continue returns to the map without recap.
result: pending

### 3. Retry then flee kindness
expected: Each failed throw shows kind break-free feedback and a new throw; after the third failure, a kind flee card appears with no Run button, berry UI, or raw catch percentage.
result: pending

### 4. Legendary hardness
expected: A legendary has a narrower perfect zone than a common and feels like a genuine chase.
result: pending

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
