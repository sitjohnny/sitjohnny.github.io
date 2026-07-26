# Pokéball Capture Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder capture glyph with sliced Pokéball sprites that rock on shake, sparkle on catch, and open on escape.

**Architecture:** Keep capture resolution outside `BallShake`. Drive an internal phase machine (`shaking` → catch sparkles or mid-open → full-open) with existing + new `encounterTimingMs` values. Render three PNGs; CSS owns rock and sparkle motion.

**Tech Stack:** React 19, Vitest + Testing Library, CSS keyframes, Vite asset imports (`pokemon-safari-app`)

**Spec:** [docs/superpowers/specs/2026-07-26-pokeball-capture-animation-design.md](../specs/2026-07-26-pokeball-capture-animation-design.md)

## Global Constraints

- Do not change capture probability, `shakeCountFor` thresholds (`>= 0.75` → 3, `>= 0.4` → 2, else 1), encounter stages, retry, or store logic
- `BallShake` still never rolls capture; it only animates a pre-resolved `caught` flag
- Rock angle: exactly `-12°` / `+12°` around `transform-origin: 50% 100%`
- Escape open step: `120ms`; full-open hold: `250ms` (named keys in `rates.ts`)
- Success cue: closed ball + **four** CSS sparkles; never open on catch
- Reduced motion: no rock; static sparkles; escape skips mid-open and uses `reducedShakeResolve`
- Sprites decorative (`aria-hidden`); keep live-region `"Caught"` / `"Broke free"`
- `onComplete` fires exactly once per mount; clear timers on unmount/dependency change

## File Map

| Path | Role |
|---|---|
| Create `pokemon-safari-app/src/assets/encounter/ball-closed.png` | Closed ball frame |
| Create `pokemon-safari-app/src/assets/encounter/ball-mid-open.png` | Mid-open frame |
| Create `pokemon-safari-app/src/assets/encounter/ball-full-open.png` | Full-open frame |
| Modify `pokemon-safari-app/src/data/rates.ts` | Add `shakeOpen` / `shakeEscapeHold` (+ reduced variants if needed) |
| Modify `pokemon-safari-app/src/data/config-surface.test.ts` | Assert new timing keys exist |
| Modify `pokemon-safari-app/src/components/encounter/BallShake.tsx` | Phase machine + sprites + sparkles |
| Create `pokemon-safari-app/src/components/encounter/BallShake.test.tsx` | Fake-timer phase / callback tests |
| Modify `pokemon-safari-app/src/index.css` | Rock keyframes, sparkles, remove obsolete `.ball-broke-free` usage |

Source strip (already in Cursor assets):  
`/Users/sitjohnny/.cursor/projects/Users-sitjohnny-Documents-coding-repos-sitjohnny-github-io/assets/Screenshot_2026-07-26_at_10.14.54_AM-89fba9ec-1ed7-44fc-8985-a46e8672dca0.png`  
(186×702 PNG, three stacked frames on pink).

---

### Task 1: Escape timing constants

**Files:**
- Modify: `pokemon-safari-app/src/data/rates.ts`
- Modify: `pokemon-safari-app/src/data/config-surface.test.ts`

**Interfaces:**
- Produces: `encounterTimingMs.shakeOpen: 120`, `encounterTimingMs.shakeEscapeHold: 250`
- Reduced motion does **not** use open/hold keys (escape jumps to full-open for `reducedShakeResolve`); still export reduced keys only if you add them — prefer **not** adding unused reduced open/hold keys (YAGNI)

- [ ] **Step 1: Extend the config-surface assertion**

In `config-surface.test.ts`, add `'shakeOpen'` and `'shakeEscapeHold'` to the `encounterTimingMs` key list inside the existing timing test.

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/data/config-surface.test.ts
```

Expected: FAIL because those keys are missing on `encounterTimingMs`.

- [ ] **Step 3: Add the keys**

In `rates.ts`, extend `encounterTimingMs`:

```ts
export const encounterTimingMs = {
  appearFlash: 240,
  spriteReveal: 180,
  feedbackHold: 1000,
  reducedFeedbackHold: 400,
  itemToast: 1800,
  gradeFlash: 600,
  reducedGradeFlash: 300,
  failBeat: 800,
  reducedFailBeat: 400,
  shakeOnce: 180,
  reducedShakeOnce: 120,
  shakeGap: 120,
  reducedShakeGap: 80,
  shakeResolve: 400,
  reducedShakeResolve: 200,
  shakeOpen: 120,
  shakeEscapeHold: 250,
} as const
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/data/config-surface.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/data/rates.ts pokemon-safari-app/src/data/config-surface.test.ts
git commit -m "$(cat <<'EOF'
feat(encounter): add pokeball open and escape-hold timings

EOF
)"
```

---

### Task 2: Slice Pokéball PNGs

**Files:**
- Create: `pokemon-safari-app/src/assets/encounter/ball-closed.png`
- Create: `pokemon-safari-app/src/assets/encounter/ball-mid-open.png`
- Create: `pokemon-safari-app/src/assets/encounter/ball-full-open.png`

**Interfaces:**
- Produces: three Vite-importable PNGs with transparent background, identical canvas size and ball alignment

- [ ] **Step 1: Install Pillow once for the slicer (local tool only)**

```bash
cd pokemon-safari-app && python3 -m pip install --user pillow
```

- [ ] **Step 2: Run this slicer** (save as a throwaway script or paste into `python3 -`)

```python
from pathlib import Path
from PIL import Image

SRC = Path(
    "/Users/sitjohnny/.cursor/projects/"
    "Users-sitjohnny-Documents-coding-repos-sitjohnny-github-io/assets/"
    "Screenshot_2026-07-26_at_10.14.54_AM-89fba9ec-1ed7-44fc-8985-a46e8672dca0.png"
)
OUT = Path("src/assets/encounter")
OUT.mkdir(parents=True, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
w, h = img.size
band_h = h // 3
names = ["ball-closed.png", "ball-mid-open.png", "ball-full-open.png"]

def key_pink(px: Image.Image) -> Image.Image:
    data = px.load()
    for y in range(px.height):
        for x in range(px.width):
            r, g, b, a = data[x, y]
            # Flat strip pink (~light rose); keep ball reds/greys
            if r > 200 and g > 140 and g < 210 and b > 150 and b < 220 and abs(r - b) < 80:
                data[x, y] = (0, 0, 0, 0)
    return px

framed = []
for i, name in enumerate(names):
    band = img.crop((0, i * band_h, w, (i + 1) * band_h if i < 2 else h))
    band = key_pink(band)
    alpha = band.split()[-1]
    bbox = alpha.getbbox()
    if bbox is None:
        raise SystemExit(f"empty frame after keying: {name}")
    framed.append(band.crop(bbox))

max_w = max(f.width for f in framed)
max_h = max(f.height for f in framed)

for name, frame in zip(names, framed):
    canvas = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
    ox = (max_w - frame.width) // 2
    oy = (max_h - frame.height) // 2
    canvas.paste(frame, (ox, oy), frame)
    # Prefer true pixel scale if the crop is an integer upscale of ~16–32px art
    for scale in (8, 6, 5, 4, 3, 2):
        if canvas.width % scale == 0 and canvas.height % scale == 0:
            small = canvas.resize(
                (canvas.width // scale, canvas.height // scale),
                Image.Resampling.NEAREST,
            )
            # Keep only if downscale still looks like a ball (>= 12px)
            if small.width >= 12 and small.height >= 12:
                canvas = small
                break
    out = OUT / name
    canvas.save(out)
    print(name, canvas.size)
```

Verify each file exists and has transparency (no solid pink).

- [ ] **Step 3: Commit assets only**

```bash
git add pokemon-safari-app/src/assets/encounter/ball-closed.png \
  pokemon-safari-app/src/assets/encounter/ball-mid-open.png \
  pokemon-safari-app/src/assets/encounter/ball-full-open.png
git commit -m "$(cat <<'EOF'
assets(encounter): add sliced pokeball capture frames

EOF
)"
```

---

### Task 3: `BallShake` phase machine + sprites (TDD)

**Files:**
- Create: `pokemon-safari-app/src/components/encounter/BallShake.test.tsx`
- Modify: `pokemon-safari-app/src/components/encounter/BallShake.tsx`

**Interfaces:**
- Consumes: `encounterTimingMs` shake keys from Task 1; PNGs from Task 2
- Produces: `data-phase` ∈ `shaking | resolve-caught | resolve-mid-open | resolve-full-open`; props unchanged (`caught`, `chance`, `onComplete`)

- [ ] **Step 1: Write failing tests**

Create `BallShake.test.tsx`:

```tsx
import { cleanup, render, screen, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { encounterTimingMs } from '@/data/rates'
import { BallShake } from '@/components/encounter/BallShake'

vi.mock('@/hooks/useMapCamera', () => ({
  prefersReducedMotion: vi.fn(() => false),
}))

import { prefersReducedMotion } from '@/hooks/useMapCamera'

const prefersReducedMotionMock = vi.mocked(prefersReducedMotion)

function ballRoot() {
  return document.querySelector('[data-ending]') as HTMLElement
}

function phase() {
  return ballRoot().getAttribute('data-phase')
}

function spriteSrc() {
  const img = ballRoot().querySelector('img') as HTMLImageElement
  return img?.getAttribute('src') ?? ''
}

beforeEach(() => {
  prefersReducedMotionMock.mockReturnValue(false)
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('BallShake sprites + phases', () => {
  it('stays on closed sprite while shaking and reports shake count from chance', () => {
    const onComplete = vi.fn()
    render(<BallShake caught chance={0.8} onComplete={onComplete} />)

    expect(ballRoot().getAttribute('data-shakes')).toBe('3')
    expect(phase()).toBe('shaking')
    expect(spriteSrc()).toMatch(/ball-closed/)
    expect(screen.getByText('Caught')).toBeInTheDocument()
  })

  it('on catch: after shakes enters resolve-caught with sparkles, never opens, then completes', () => {
    const onComplete = vi.fn()
    render(<BallShake caught chance={0.5} onComplete={onComplete} />)
    // 2 shakes: once + gap + once
    const shakeTotal =
      2 * encounterTimingMs.shakeOnce + encounterTimingMs.shakeGap

    act(() => {
      vi.advanceTimersByTime(shakeTotal)
    })
    expect(phase()).toBe('resolve-caught')
    expect(spriteSrc()).toMatch(/ball-closed/)
    expect(ballRoot().querySelectorAll('[data-sparkle]')).toHaveLength(4)
    expect(spriteSrc()).not.toMatch(/open/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeResolve)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('on escape: mid-open then full-open hold, then completes', () => {
    const onComplete = vi.fn()
    render(<BallShake caught={false} chance={0.2} onComplete={onComplete} />)
    const shakeTotal = encounterTimingMs.shakeOnce // 1 shake

    act(() => {
      vi.advanceTimersByTime(shakeTotal)
    })
    expect(phase()).toBe('resolve-mid-open')
    expect(spriteSrc()).toMatch(/ball-mid-open/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeOpen)
    })
    expect(phase()).toBe('resolve-full-open')
    expect(spriteSrc()).toMatch(/ball-full-open/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeEscapeHold)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('reduced motion: skip mid-open on escape; complete after reducedShakeResolve', () => {
    prefersReducedMotionMock.mockReturnValue(true)
    const onComplete = vi.fn()
    render(<BallShake caught={false} chance={0.2} onComplete={onComplete} />)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.reducedShakeOnce)
    })
    expect(phase()).toBe('resolve-full-open')
    expect(spriteSrc()).toMatch(/ball-full-open/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.reducedShakeResolve)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('clears timers on unmount without calling onComplete twice', () => {
    const onComplete = vi.fn()
    const { unmount } = render(
      <BallShake caught chance={0.2} onComplete={onComplete} />,
    )
    unmount()
    act(() => {
      vi.runAllTimers()
    })
    expect(onComplete).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/components/encounter/BallShake.test.tsx
```

Expected: FAIL (no `data-phase` / sprites / sparkles yet).

- [ ] **Step 3: Implement `BallShake`**

Replace `BallShake.tsx` with:

```tsx
import { useEffect, useState } from 'react'
import { encounterTimingMs } from '@/data/rates'
import { prefersReducedMotion } from '@/hooks/useMapCamera'
import ballClosed from '@/assets/encounter/ball-closed.png'
import ballMidOpen from '@/assets/encounter/ball-mid-open.png'
import ballFullOpen from '@/assets/encounter/ball-full-open.png'

type BallShakeProps = {
  caught: boolean
  /** Pre-resolved catch chance — drives 1–3 flavor shakes only (D-30). */
  chance: number
  onComplete: () => void
}

type Phase =
  | 'shaking'
  | 'resolve-caught'
  | 'resolve-mid-open'
  | 'resolve-full-open'

function shakeCountFor(chance: number): 1 | 2 | 3 {
  if (chance >= 0.75) return 3
  if (chance >= 0.4) return 2
  return 1
}

function spriteFor(phase: Phase): string {
  if (phase === 'resolve-mid-open') return ballMidOpen
  if (phase === 'resolve-full-open') return ballFullOpen
  return ballClosed
}

/**
 * Flavor shakes to a pre-resolved caught flag (D-30 / D-31). Never rolls capture.
 * Fail ending opens the ball (mid → full hold) before onComplete → fail beat.
 */
export function BallShake({ caught, chance, onComplete }: BallShakeProps) {
  const reducedMotion = prefersReducedMotion()
  const shakes = shakeCountFor(chance)
  const [phase, setPhase] = useState<Phase>('shaking')
  /** While shaking (and not reduced), true only during each `shakeOnce` window. */
  const [rocking, setRocking] = useState(() => !prefersReducedMotion())

  useEffect(() => {
    let cancelled = false
    const timers: number[] = []

    const once = reducedMotion
      ? encounterTimingMs.reducedShakeOnce
      : encounterTimingMs.shakeOnce
    const gap = reducedMotion
      ? encounterTimingMs.reducedShakeGap
      : encounterTimingMs.shakeGap

    const schedule = (delay: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn()
      }, delay)
      timers.push(id)
    }

    const beginResolve = () => {
      setRocking(false)
      if (caught) {
        setPhase('resolve-caught')
        schedule(
          reducedMotion
            ? encounterTimingMs.reducedShakeResolve
            : encounterTimingMs.shakeResolve,
          onComplete,
        )
        return
      }
      if (reducedMotion) {
        setPhase('resolve-full-open')
        schedule(encounterTimingMs.reducedShakeResolve, onComplete)
        return
      }
      setPhase('resolve-mid-open')
      schedule(encounterTimingMs.shakeOpen, () => {
        setPhase('resolve-full-open')
        schedule(encounterTimingMs.shakeEscapeHold, onComplete)
      })
    }

    // Distinct rocks with neutral gaps: rock for `once`, idle `gap`, repeat.
    let remaining = shakes
    const runShakeCycle = () => {
      if (reducedMotion) {
        setRocking(false)
        schedule(once, () => {
          remaining -= 1
          if (remaining <= 0) beginResolve()
          else runShakeCycle()
        })
        return
      }
      setRocking(true)
      schedule(once, () => {
        setRocking(false)
        remaining -= 1
        if (remaining <= 0) {
          beginResolve()
          return
        }
        schedule(gap, runShakeCycle)
      })
    }
    runShakeCycle()

    return () => {
      cancelled = true
      for (const id of timers) window.clearTimeout(id)
    }
  }, [caught, onComplete, reducedMotion, shakes])

  const onceMs = reducedMotion
    ? encounterTimingMs.reducedShakeOnce
    : encounterTimingMs.shakeOnce

  return (
    <div className="gba-dialog flex w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div
        aria-hidden="true"
        className={[
          'ball-shake relative flex h-16 w-16 items-center justify-center',
          rocking ? 'ball-rock' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-shakes={shakes}
        data-caught={caught ? 'true' : 'false'}
        data-ending={caught ? 'caught' : 'broke-free'}
        data-phase={phase}
        style={
          rocking
            ? { animationDuration: `${onceMs}ms`, animationIterationCount: 1 }
            : undefined
        }
      >
        <img
          src={spriteFor(phase)}
          alt=""
          draggable={false}
          className="ball-shake__sprite h-16 w-16"
        />
        {phase === 'resolve-caught'
          ? [0, 1, 2, 3].map((i) => (
              <span
                key={i}
                data-sparkle={i}
                className={[
                  'ball-sparkle',
                  reducedMotion ? 'ball-sparkle--static' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ))
          : null}
      </div>
      <p aria-live="polite" className="sr-only">
        {caught ? 'Caught' : 'Broke free'}
      </p>
    </div>
  )
}
```

Also update the catch/escape tests: advance timers with the full shake cycle formula `shakes * once + max(0, shakes - 1) * gap` before asserting resolve phases. On catch under reduced motion, resolve duration is `reducedShakeResolve` (wired above).

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/components/encounter/BallShake.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/components/encounter/BallShake.tsx \
  pokemon-safari-app/src/components/encounter/BallShake.test.tsx
git commit -m "$(cat <<'EOF'
feat(encounter): drive BallShake with pokeball sprite phases

EOF
)"
```

---

### Task 4: Rock + sparkle CSS

**Files:**
- Modify: `pokemon-safari-app/src/index.css`
- Modify: `pokemon-safari-app/src/components/encounter/BallShake.tsx` (only if class names need tweak)
- Modify: `pokemon-safari-app/src/components/encounter/BallShake.test.tsx` (assert `ball-rock` when shaking / absent when reduced)

**Interfaces:**
- Consumes: `.ball-rock`, `.ball-sparkle`, `.ball-shake__sprite` classes from Task 3 markup
- Removes: reliance on `.ball-broke-free` for the open glyph (delete rule if unused)

- [ ] **Step 1: Add failing assertion for rock class**

Append to `BallShake.test.tsx`:

```tsx
  it('applies ball-rock while shaking unless reduced motion', () => {
    const { unmount } = render(
      <BallShake caught chance={0.2} onComplete={vi.fn()} />,
    )
    expect(ballRoot().className).toMatch(/ball-rock/)
    unmount()

    prefersReducedMotionMock.mockReturnValue(true)
    render(<BallShake caught chance={0.2} onComplete={vi.fn()} />)
    expect(ballRoot().className).not.toMatch(/ball-rock/)
  })
```

Run:

```bash
cd pokemon-safari-app && npm test -- src/components/encounter/BallShake.test.tsx
```

If Task 3 already adds `ball-rock`, this passes; otherwise implement CSS + class wiring.

- [ ] **Step 2: Add CSS**

In `index.css`, replace `.ball-broke-free` with:

```css
  .ball-shake__sprite {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    width: 64px;
    height: 64px;
    object-fit: contain;
    display: block;
  }

  .ball-rock {
    transform-origin: 50% 100%;
    animation-name: ball-rock;
    animation-timing-function: ease-in-out;
  }

  @keyframes ball-rock {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(-12deg);
    }
    75% {
      transform: rotate(12deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  .ball-sparkle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: var(--color-accent);
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    animation: ball-sparkle-pop 400ms ease-out both;
  }

  .ball-sparkle--static {
    animation: none;
    opacity: 1;
  }

  .ball-sparkle[data-sparkle='0'] {
    top: 2px;
    left: 8px;
  }
  .ball-sparkle[data-sparkle='1'] {
    top: 4px;
    right: 6px;
  }
  .ball-sparkle[data-sparkle='2'] {
    bottom: 10px;
    left: 4px;
  }
  .ball-sparkle[data-sparkle='3'] {
    bottom: 8px;
    right: 8px;
  }

  @keyframes ball-sparkle-pop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    40% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ball-rock {
      animation: none !important;
    }
    .ball-sparkle {
      animation: none;
      opacity: 1;
    }
  }
```

Remove the old `.ball-broke-free` rule if nothing else references it.

- [ ] **Step 3: Run BallShake + a quick encounter smoke**

```bash
cd pokemon-safari-app && npm test -- src/components/encounter/BallShake.test.tsx src/components/encounter/EncounterOverlay.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Manual check in `npm run dev`**

Throw once with high chance (catch): closed rocks → four sparkles → result.  
Throw fail: closed rocks → mid-open → full-open hold → fail beat.

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/index.css \
  pokemon-safari-app/src/components/encounter/BallShake.tsx \
  pokemon-safari-app/src/components/encounter/BallShake.test.tsx
git commit -m "$(cat <<'EOF'
feat(encounter): add pokeball rock and catch sparkle CSS

EOF
)"
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|---|---|
| Slice 3 transparent aligned PNGs | Task 2 |
| Closed ball rocks ±12° during flavor shakes | Tasks 3–4 |
| Catch: closed + 4 sparkles for `shakeResolve` | Tasks 3–4 |
| Escape: mid 120ms → full hold 250ms → fail beat | Tasks 1, 3 |
| Timing keys in `rates.ts` | Task 1 |
| Reduced motion: no rock, static sparkles, skip mid-open | Tasks 3–4 |
| Preserve live-region + `data-*`; add `data-phase` | Task 3 |
| No capture/store/flow changes | All (out of scope) |
| `onComplete` once; clear timers | Task 3 |
| Tests for phases / reduced / cleanup | Task 3–4 |

## Self-Review Notes

- No TBD/placeholder steps.
- Phase names match the spec exactly.
- Escape hold uses `shakeEscapeHold` (250); mid uses `shakeOpen` (120); success uses `shakeResolve` / `reducedShakeResolve`.
- Rock gaps are enforced in JS (`rocking` true for `shakeOnce`, false for `shakeGap`) so each cycle returns to neutral before the next rock.
