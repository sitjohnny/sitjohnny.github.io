/**
 * Kid-friendly relative dates from ISO timestamps (D-20).
 * Compares local calendar days — not 24-hour windows (Pitfall 8).
 */

function localYmd(d: Date): { y: number; m: number; day: number } {
  return { y: d.getFullYear(), m: d.getMonth(), day: d.getDate() }
}

/** Whole local calendar days from `then` to `now` (non-negative when then ≤ now). */
function localDayDiff(then: Date, now: Date): number {
  const a = localYmd(then)
  const b = localYmd(now)
  const utcThen = Date.UTC(a.y, a.m, a.day)
  const utcNow = Date.UTC(b.y, b.m, b.day)
  return Math.round((utcNow - utcThen) / 86_400_000)
}

export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  if (Number.isNaN(Date.parse(iso))) {
    return 'Sometime'
  }
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) {
    return 'Sometime'
  }

  const diff = localDayDiff(then, now)
  if (diff < 0) {
    // Future timestamps — fall back to short local date rather than negative "ago".
    return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff >= 2 && diff <= 6) return `${diff} days ago`
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
